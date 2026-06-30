import { useEffect, useRef, useState } from "react";
import {
  deleteVerdict,
  getHistory,
  getStreak,
} from "../services/storageService";
import { ArrowLeftIcon, ChevronDownIcon, ScaleIcon, ShareIcon, TrashIcon } from "../components/Icons";
import { shareVerdict } from "../services/shareCard";
import { textPressIn, textPressOut } from "../utils/touch";

const DELETE_WIDTH = 80;

function formatDate(isoString) {
  const date = new Date(isoString);
  const diffDays = Math.floor((Date.now() - date) / 86_400_000);
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7)
    return date.toLocaleDateString(undefined, { weekday: "short" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StreakCard({ streak }) {
  const empty = streak.current === 0 && streak.best === 0;
  const numClass = `text-3xl font-bold tabular-nums ${empty ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-900 dark:text-white"}`;
  return (
    <div className={`rounded-xl bg-zinc-50 dark:bg-[#222229] border border-zinc-200 dark:border-[#38383f] flex overflow-hidden transition-opacity${empty ? " opacity-50" : ""}`}>
      <div className="flex-1 flex flex-col items-center py-4 gap-1">
        <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          current streak
        </span>
        <span className={numClass}>
          {streak.current > 0 ? "🔥 " : ""}
          {streak.current}
        </span>
      </div>
      <div className="w-px bg-zinc-200 dark:bg-[#38383f]" />
      <div className="flex-1 flex flex-col items-center py-4 gap-1">
        <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          personal best
        </span>
        <span className={numClass}>{streak.best}</span>
      </div>
    </div>
  );
}

function HistoryEntry({
  entry,
  isExpanded,
  onToggle,
  onDelete,
  isSwipeOpen,
  onSwipeOpen,
  onSwipeClose,
}) {
  const { topicLabel, createdAt, sideAPercentage, ruling, won } = entry;
  const outerRef = useRef(null);
  const contentRef = useRef(null);
  const touchState = useRef({
    startX: 0,
    startY: 0,
    currentOffset: 0,
    isSliding: false,
    isOpen: false,
    directionDetermined: false,
    wasSwiping: false,
  });
  // Keep callbacks fresh without re-running the touch listener effect
  const cb = useRef({ onSwipeOpen, onSwipeClose, onDelete });
  useEffect(() => {
    cb.current = { onSwipeOpen, onSwipeClose, onDelete };
  });

  // Close this entry when another entry opens
  useEffect(() => {
    if (!isSwipeOpen && touchState.current.isOpen) {
      const el = contentRef.current;
      if (!el) return;
      el.style.transition = "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)";
      el.style.transform = "translateX(0)";
      el.addEventListener(
        "transitionend",
        () => {
          el.style.transition = "";
        },
        { once: true },
      );
      touchState.current.isOpen = false;
      touchState.current.currentOffset = 0;
    }
  }, [isSwipeOpen]);

  // Touch event setup — runs once, uses refs for everything
  useEffect(() => {
    const outer = outerRef.current;
    const el = contentRef.current;
    if (!el || !outer) return;
    const t = touchState.current;

    function setPressedBg() {
      const isDark = document.documentElement.classList.contains("dark");
      el.style.backgroundColor = isDark ? "rgb(39 39 42)" : "rgb(244 244 245)";
    }
    function clearPressedBg() {
      el.style.backgroundColor = "";
    }

    // Scale tap feedback — instant down, 120ms ease up
    let scaleApplied = false;
    function applyScale() {
      outer.style.transform = "scale(0.98)";
      scaleApplied = true;
    }
    function releaseScale() {
      if (!scaleApplied) return;
      scaleApplied = false;
      outer.style.transition = "border-color 180ms ease, transform 120ms ease";
      outer.style.transform = "";
      // React will reset outer.style.transition on its next render; this is
      // a safety clear in case no re-render follows (e.g. scroll path)
      outer.addEventListener("transitionend", function onEnd(ev) {
        if (ev.propertyName === "transform") {
          outer.style.transition = "";
          outer.removeEventListener("transitionend", onEnd);
        }
      });
    }

    function snapTo(offset, animated) {
      if (animated) {
        el.style.transition = "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)";
        el.addEventListener(
          "transitionend",
          () => {
            el.style.transition = "";
          },
          { once: true },
        );
      } else {
        el.style.transition = "";
      }
      el.style.transform = `translateX(${offset}px)`;
      t.currentOffset = offset;
    }

    function onTouchStart(e) {
      const touch = e.touches[0];
      t.startX = touch.clientX;
      t.startY = touch.clientY;
      t.isSliding = false;
      t.directionDetermined = false;
      t.wasSwiping = false;
      el.style.transition = "none";
      setPressedBg();
      applyScale();
    }

    function onTouchMove(e) {
      const touch = e.touches[0];
      const dx = touch.clientX - t.startX;
      const dy = touch.clientY - t.startY;

      if (!t.directionDetermined) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        t.directionDetermined = true;
        if (Math.abs(dx) >= Math.abs(dy)) {
          t.isSliding = true;
          clearPressedBg(); // swiping, not tapping
          releaseScale();
        } else {
          clearPressedBg(); // scrolling, not tapping
          releaseScale();
          el.style.transition = "";
          return;
        }
      }

      if (!t.isSliding) return;
      e.preventDefault(); // block scroll during horizontal swipe
      t.wasSwiping = true;

      const base = t.isOpen ? -DELETE_WIDTH : 0;
      const clamped = Math.max(-DELETE_WIDTH, Math.min(0, base + dx));
      el.style.transform = `translateX(${clamped}px)`;
      t.currentOffset = clamped;
    }

    function onTouchEnd() {
      clearPressedBg(); // always clear on lift, before any transition is restored
      if (!t.isSliding) {
        releaseScale(); // tap — release scale with animation
        el.style.transition = "";
        return;
      }
      const wasOpen = t.isOpen;
      if (t.currentOffset < -(DELETE_WIDTH / 2)) {
        snapTo(-DELETE_WIDTH, true);
        t.isOpen = true;
        if (!wasOpen) cb.current.onSwipeOpen();
      } else {
        snapTo(0, true);
        t.isOpen = false;
        if (wasOpen) cb.current.onSwipeClose();
      }
    }

    function onTouchCancel() {
      clearPressedBg();
      releaseScale();
      el.style.transition = "";
      t.isSliding = false;
      t.directionDetermined = false;
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, []); // no deps — all mutable state lives in refs

  function handleClick() {
    const t = touchState.current;
    // Suppress the synthetic click that follows a touch swipe
    if (t.wasSwiping) {
      t.wasSwiping = false;
      return;
    }
    // Tap on open entry closes the swipe instead of toggling expand
    if (t.isOpen) {
      const el = contentRef.current;
      if (el) {
        el.style.transition = "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)";
        el.style.transform = "translateX(0)";
        el.addEventListener(
          "transitionend",
          () => {
            el.style.transition = "";
          },
          { once: true },
        );
      }
      t.isOpen = false;
      t.currentOffset = 0;
      cb.current.onSwipeClose();
      return;
    }
    onToggle();
  }

  function handleShare(e) {
    e.stopPropagation();
    shareVerdict(entry).catch((err) => {
      if (err?.name !== "AbortError") console.error("Share failed:", err);
    });
  }

  return (
    <div
      ref={outerRef}
      className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-[#38383f]"
      style={{
        transition: "border-color 180ms ease",
        borderColor: isExpanded ? "var(--accent-border)" : undefined,
      }}
    >
      {/* Delete button revealed on swipe */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500"
        style={{ width: DELETE_WIDTH }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            cb.current.onDelete(entry.id);
          }}
          className="w-full h-full flex items-center justify-center text-white"
          aria-label="Delete entry"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <TrashIcon size={18} />
        </button>
      </div>

      {/* Slideable content layer */}
      <div
        ref={contentRef}
        onClick={handleClick}
        className="relative px-4 py-3 bg-zinc-50 dark:bg-[#222229] cursor-pointer"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-white leading-snug flex-1">
            {topicLabel}
          </span>
          <span className="text-xs text-zinc-400 shrink-0 mt-0.5">
            {formatDate(createdAt)}
          </span>
        </div>

        {/* Score row */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color: won ? "var(--accent)" : undefined }}
            >
              <span className={won ? "" : "text-red-500"}>
                {sideAPercentage}%
              </span>
            </span>
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded ${won ? "" : "bg-red-500/10 text-red-500"}`}
              style={won ? { background: "var(--accent-dim)", color: "var(--accent)" } : undefined}
            >
              {won ? "won" : "lost"}
            </span>
          </div>
          <span
            className="text-zinc-400 transition-transform duration-300"
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <ChevronDownIcon />
          </span>
        </div>

        {/* Ruling — expands inline */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: isExpanded ? "300px" : "0px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              opacity: isExpanded ? 1 : 0,
              transition: isExpanded
                ? "opacity 150ms ease 300ms"
                : "opacity 0ms",
            }}
          >
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pt-3 mt-3 border-t border-zinc-200 dark:border-[#38383f]">
              {ruling}
            </p>
            <div className="flex justify-end mt-2">
              <button
                onClick={handleShare}
                aria-label="Share this verdict"
                className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-[var(--accent)] transition-colors"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <ShareIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onGoSettle }) {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div
        className="flex items-center justify-center rounded-2xl bg-zinc-100 dark:bg-[#222229] border border-zinc-200 dark:border-[#38383f]"
        style={{ width: 52, height: 52 }}
      >
        <span style={{ color: "var(--accent)" }}>
          <ScaleIcon size={22} />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-zinc-900 dark:text-white">
          no arguments settled yet.
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          surely someone&apos;s wrong about something right now.
        </p>
      </div>
      <button
        type="button"
        onClick={onGoSettle}
        onTouchStart={textPressIn}
        onTouchEnd={textPressOut}
        onTouchCancel={textPressOut}
        className="flex items-center gap-1.5 text-sm font-medium bg-transparent border-none cursor-pointer"
        style={{ color: "var(--accent)", WebkitTapHighlightColor: "transparent" }}
      >
        <ArrowLeftIcon size={14} />
        start a settle
      </button>
    </div>
  );
}

export function HistoryScreen({ onGoSettle }) {
  const [history, setHistory] = useState(() => getHistory());
  const [streak] = useState(() => getStreak());
  const [expandedId, setExpandedId] = useState(null);
  const [openSwipeId, setOpenSwipeId] = useState(null);

  function toggleEntry(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function deleteEntry(id) {
    deleteVerdict(id);
    setHistory((prev) => prev.filter((e) => e.id !== id));
    if (expandedId === id) setExpandedId(null);
    setOpenSwipeId(null);
    try {
      navigator.vibrate && navigator.vibrate(30);
    } catch {
      // Vibration API unavailable — not a user-facing error
    }
  }

  return (
    <div
      className="min-h-[100dvh] flex flex-col bg-white dark:bg-[#09090f] transition-colors duration-200"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto px-5 pt-4 pb-24">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white mb-6">
          settle it<span style={{ color: "var(--accent)" }}>.</span>
        </h1>

        <StreakCard streak={streak} />

        {history.length === 0 ? (
          <div className="flex-1 flex flex-col">
            <div style={{ flex: 1 }} />
            <EmptyState onGoSettle={onGoSettle} />
            <div style={{ flex: 2 }} />
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-6">
            {history.map((entry) => (
              <HistoryEntry
                key={entry.id}
                entry={entry}
                isExpanded={expandedId === entry.id}
                onToggle={() => toggleEntry(entry.id)}
                onDelete={deleteEntry}
                isSwipeOpen={openSwipeId === entry.id}
                onSwipeOpen={() => setOpenSwipeId(entry.id)}
                onSwipeClose={() => setOpenSwipeId(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
