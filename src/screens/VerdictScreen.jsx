import { useEffect, useRef, useState } from "react";
import { shareVerdict } from "../services/shareCard";
import { playVerdictSound } from "../services/soundService";
import { BoltIcon, EditIcon, ShareIcon } from "../components/Icons";

const ANIM_DURATION = 1000;

function springEase(t) {
  // easeOutBack — slight overshoot then settle, approximates iOS spring physics
  const c1 = 1.0;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function VerdictScreen({ verdict, onNewSettle, onArgueBetter }) {
  const { sideAPercentage, ruling, topicLabel } = verdict;

  const [displayA, setDisplayA] = useState(50);
  const [displayB, setDisplayB] = useState(50);
  const [rulingVisible, setRulingVisible] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / ANIM_DURATION, 1);
      const eased = springEase(progress);

      const animA = Math.min(100, Math.max(0, Math.round(50 + (sideAPercentage - 50) * eased)));
      setDisplayA(animA);
      setDisplayB(100 - animA);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setRulingVisible(true);
        playVerdictSound(sideAPercentage);
        if (sideAPercentage >= 85) {
          setCelebrating(true);
          try { navigator.vibrate && navigator.vibrate([50, 50, 50, 50, 100]); } catch { /* Vibration API unavailable */ }
        }
      }
    }

    try { navigator.vibrate && navigator.vibrate([40, 30, 60]); } catch { /* Vibration API unavailable */ }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [sideAPercentage]);

  function handleShare() {
    shareVerdict(verdict).catch((err) => {
      // User cancelled the share sheet — not an error worth surfacing
      if (err?.name !== "AbortError") console.error("Share failed:", err);
    });
  }

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 flex justify-center items-center transition-colors duration-200" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="w-full max-w-[480px] flex flex-col px-5 pt-6 pb-10 gap-8">

        {/* App name */}
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          settle it<span style={{ color: "var(--accent)" }}>.</span>
        </h1>

        {/* Score block */}
        <div className="flex flex-col gap-5">

          {/* Topic label */}
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            {topicLabel}
          </p>

          {/* Percentages */}
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              {celebrating && (
                <span
                  className="inline-flex items-center gap-1 rounded-full animate-fade-in mb-3 self-start"
                  style={{
                    fontSize: "11px",
                    padding: "4px 10px",
                    color: "var(--accent)",
                    background: "var(--accent-dim)",
                    border: "1px solid var(--accent-border)",
                  }}
                >
                  <BoltIcon size={10} />
                  {sideAPercentage >= 95 ? "total domination" : "decisive win"}
                </span>
              )}
              <span
                className={`text-7xl font-bold tabular-nums leading-none${celebrating ? " celebrate-glow" : ""}`}
                style={{ color: "var(--accent)" }}
              >
                {displayA}
                <span className="text-3xl font-semibold">%</span>
              </span>
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-2">
                you
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-7xl font-bold tabular-nums leading-none text-zinc-300 dark:text-zinc-600">
                {displayB}
                <span className="text-3xl font-semibold">%</span>
              </span>
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-2">
                them
              </span>
            </div>
          </div>

          {/* Meter bar */}
          <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full${celebrating ? " celebrate-meter" : ""}`}
              style={{
                width: `${displayA}%`,
                background: "linear-gradient(to right, var(--accent-meter-from), var(--accent-meter-to))",
                transition: "none",
              }}
            />
          </div>
        </div>

        {/* Ruling card */}
        <div
          className="rounded-2xl px-5 py-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
          style={{
            opacity: rulingVisible ? 1 : 0,
            transition: rulingVisible ? "opacity 0.5s ease" : "none",
          }}
        >
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {ruling}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          {/* Row 1: argue better + share */}
          <div className="flex gap-2">
            <button
              onClick={onArgueBetter}
              className="flex-1 flex items-center justify-center gap-1.5 text-white active:brightness-90 transition-all duration-100"
              style={{
                background: "linear-gradient(to bottom, var(--accent-g-from), var(--accent-g-to))",
                borderRadius: "14px",
                padding: "13px",
                fontSize: "12.5px",
                fontWeight: 500,
                letterSpacing: "-0.1px",
              }}
            >
              <EditIcon size={13} />
              argue better
            </button>
            <button
              onClick={handleShare}
              aria-label="Share verdict"
              className="flex items-center justify-center shrink-0 bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#28282e] text-zinc-500 dark:text-zinc-400 active:brightness-90 transition-all duration-100"
              style={{ width: 46, height: 46, borderRadius: "14px" }}
            >
              <ShareIcon size={15} />
            </button>
          </div>

          {/* Row 2: new settle text link */}
          <button
            onClick={onNewSettle}
            className="w-full text-center text-zinc-600 dark:text-zinc-500 bg-transparent border-none cursor-pointer"
            style={{ fontSize: "11px", padding: "4px" }}
          >
            new settle
          </button>
        </div>

      </div>
    </div>
  );
}
