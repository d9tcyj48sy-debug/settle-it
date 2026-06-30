import { useEffect, useRef, useState } from "react";
import { deleteVerdict, getHistory, getStreak } from "../services/storageService";
import { ChevronDownIcon, ShareIcon, TrashIcon } from "../components/Icons";
import { shareVerdict } from "../services/shareCard";

const DELETE_WIDTH = 80;

function formatDate(isoString) {
  const date = new Date(isoString);
  const diffDays = Math.floor((Date.now() - date) / 86_400_000);
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: "short" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StreakCard({ streak }) {
  return (
    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex overflow-hidden">
      <div className="flex-1 flex flex-col items-center py-4 gap-1">
        <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          current streak
        </span>
        <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-white">
          {streak.current > 0 ? "🔥 " : ""}
          {streak.current}
        </span>
      </div>
      <div className="w-px bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex-1 flex flex-col items-center py-4 gap-1">
        <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          personal best
        </span>
        <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-white">
          {streak.best}
        </span>
      </div>
    </div>
  );
}

function HistoryEntry({ entry, isExpanded, onToggle, onDelete, isSwipeOpen, onSwipeOpen, onSwipeClose }) {
  const { topicLabel, createdAt, sideAPercentage, ruling, won } = entry;
  const contentRef = useRef(null);
  const touchState = useRef({
    startX: 0, startY: 0,
    currentOffset: 0,
    isSliding: false,
    isOpen: false,
    directionDetermined: false,
    wasSwiping: false,
  });
  // Keep callbacks fresh without re-running the touch listener effect
  const cb = useRef({ onSwipeOpen, onSwipeClose, onDelete });
  useEffect(() => { cb.current = { onSwipeOpen, onSwipeClose, onDelete }; });

  // Close this entry when another entry opens
  useEffect(() => {
    if (!isSwipeOpen && touchState.current.isOpen) {
      const el = contentRef.current;
      if (!el) return;
      el.style.transition = "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)";
      el.style.transform = "translateX(0)";
      el.addEventListener("transitionend", () => { el.style.transition = ""; }, { once: true });
      touchState.current.isOpen = false;
      touchState.current.currentOffset = 0;
    }
  }, [isSwipeOpen]);

  // Touch event setup — runs once, uses refs for everything
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const t = touchState.current;

    function snapTo(offset, animated) {
      if (animated) {
        el.style.transition = "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)";
        el.addEventListener("transitionend", () => { el.style.transition = ""; }, { once: true });
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
      el.style.transition = "none"; // kill any running animation
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
        } else {
          el.style.transition = ""; // restore for vertical scroll
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
      if (!t.isSliding) {
        el.style.transition = ""; // restore from onTouchStart's 'none'
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

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
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
        el.addEventListener("transitionend", () => { el.style.transition = ""; }, { once: true });
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
    <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      {/* Delete button revealed on swipe */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500"
        style={{ width: DELETE_WIDTH }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); cb.current.onDelete(entry.id); }}
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
        className="relative px-4 py-3 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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
              style={{ color: won ? "#7c5cfc" : undefined }}
            >
              <span className={won ? "" : "text-red-500"}>{sideAPercentage}%</span>
            </span>
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                won
                  ? "bg-[#7c5cfc]/10 text-[#7c5cfc]"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {won ? "won" : "lost"}
            </span>
          </div>
          <span
            className="text-zinc-400 transition-transform duration-300"
            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <ChevronDownIcon />
          </span>
        </div>

        {/* Ruling — expands inline */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: isExpanded ? "300px" : "0px" }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-800">
              {ruling}
            </p>
            <div className="flex justify-end mt-2">
              <button
                onClick={handleShare}
                aria-label="Share this verdict"
                className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-[#7c5cfc] transition-colors"
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="text-4xl mb-4">⚖️</span>
      <p className="text-base font-semibold text-zinc-900 dark:text-white mb-1">
        no arguments settled yet.
      </p>
      <p className="text-sm text-zinc-500">got beef with someone?</p>
    </div>
  );
}

export function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [expandedId, setExpandedId] = useState(null);
  const [openSwipeId, setOpenSwipeId] = useState(null);

  useEffect(() => {
    setHistory(getHistory());
    setStreak(getStreak());
  }, []);

  function toggleEntry(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function deleteEntry(id) {
    deleteVerdict(id);
    setHistory((prev) => prev.filter((e) => e.id !== id));
    if (expandedId === id) setExpandedId(null);
    setOpenSwipeId(null);
    try { navigator.vibrate && navigator.vibrate(30); } catch (_) {}
  }

  return (
    <div
      className="min-h-[100dvh] bg-white dark:bg-zinc-950 transition-colors duration-200"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="max-w-[480px] mx-auto px-5 pt-4 pb-24">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white mb-6">
          settle it<span style={{ color: "#7c5cfc" }}>.</span>
        </h1>

        <StreakCard streak={streak} />

        {history.length === 0 ? (
          <EmptyState />
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
