import { useEffect, useState } from "react";
import { ScaleIcon } from "../components/Icons";

const MESSAGES = [
  "weighing both sides…",
  "consulting the vibes…",
  "somebody's about to be humbled…",
  "this might sting a little…",
  "finding the truth in all this…",
  "the jury is deliberating…",
  "separating facts from feelings…",
  "almost ready to destroy someone's ego…",
];

const SLOW_MESSAGES = [
  "still weighing things carefully…",
  "good arguments take a moment…",
  "almost got a verdict…",
  "the jury's being thorough…",
];

const SLOW_AFTER_MS = 6000;

function PulsingDots() {
  return (
    <span className="inline-flex gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="dot-pulse inline-block w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </span>
  );
}

export function LoadingScreen() {
  const [tick, setTick] = useState(0);
  const [slowMode, setSlowMode] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setSlowMode(true), SLOW_AFTER_MS);
    return () => clearTimeout(id);
  }, []);

  const messages = slowMode ? SLOW_MESSAGES : MESSAGES;
  const msgIndex = tick % messages.length;

  return (
    <div
      className="min-h-[100dvh] bg-zinc-50 dark:bg-[#0e0e0f] flex items-center justify-center transition-colors duration-200"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex flex-col items-center gap-6 px-8 text-center">
        <span style={{ color: "var(--accent)" }}>
          <ScaleIcon size={48} />
        </span>

        <div className="flex flex-col items-center gap-3">
          <p
            key={tick}
            className="text-base text-zinc-600 dark:text-zinc-300 animate-fade-in"
          >
            {messages[msgIndex]}
          </p>
          <PulsingDots />
        </div>
      </div>

      {/* Ambient progress shimmer — full-width, fixed at screen bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 overflow-hidden bg-zinc-200 dark:bg-zinc-800"
        style={{ height: 2 }}
      >
        <div className="loading-shimmer" />
      </div>
    </div>
  );
}
