import { useEffect, useRef, useState } from "react";
import { shareVerdict } from "../services/shareCard";

const ANIM_DURATION = 1000;

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function VerdictScreen({ verdict, onNewSettle }) {
  const { sideAPercentage, sideBPercentage, ruling, topicLabel } = verdict;

  const [displayA, setDisplayA] = useState(50);
  const [displayB, setDisplayB] = useState(50);
  const [rulingVisible, setRulingVisible] = useState(false);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / ANIM_DURATION, 1);
      const eased = easeOutCubic(progress);

      const animA = Math.round(50 + (sideAPercentage - 50) * eased);
      setDisplayA(animA);
      setDisplayB(100 - animA);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setRulingVisible(true);
      }
    }

    try { navigator.vibrate && navigator.vibrate([40, 30, 60]); } catch (_) {}

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
          settle it<span style={{ color: "#7c5cfc" }}>.</span>
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
              <span
                className="text-7xl font-bold tabular-nums leading-none"
                style={{ color: "#7c5cfc" }}
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
              className="h-full rounded-full"
              style={{
                width: `${displayA}%`,
                backgroundColor: "#7c5cfc",
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
        <div className="flex flex-col gap-3">
          <button
            onClick={handleShare}
            className="w-full py-4 rounded-xl text-base font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-[#7c5cfc] hover:text-[#7c5cfc] transition-colors"
          >
            share
          </button>
          <button
            onClick={onNewSettle}
            className="w-full py-4 rounded-xl text-base font-semibold bg-[#7c5cfc] text-white hover:brightness-110 active:scale-[0.98] transition-all duration-150"
          >
            new settle
          </button>
        </div>

      </div>
    </div>
  );
}
