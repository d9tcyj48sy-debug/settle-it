import { useEffect, useState } from "react";

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

function ScaleIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* pole + base */}
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="9" y1="21" x2="15" y2="21" />
      {/* beam */}
      <line x1="2" y1="7" x2="22" y2="7" />
      {/* left pan */}
      <path d="M2 7v5a4 4 0 0 0 8 0V7" />
      {/* right pan */}
      <path d="M14 7v5a4 4 0 0 0 8 0V7" />
    </svg>
  );
}

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
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 flex items-center justify-center transition-colors duration-200">
      <div className="flex flex-col items-center gap-6 px-8 text-center">
        <span style={{ color: "#7c5cfc" }}>
          <ScaleIcon />
        </span>

        <div className="flex flex-col items-center gap-3">
          <p
            key={msgIndex}
            className="text-base text-zinc-600 dark:text-zinc-300 animate-fade-in"
          >
            {MESSAGES[msgIndex]}
          </p>
          <PulsingDots />
        </div>
      </div>
    </div>
  );
}
