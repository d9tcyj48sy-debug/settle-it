import { useState } from "react";
import { useTheme } from "../context/useTheme";

const MAX = 500;
const WARN = 400;

function SunIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function CharCount({ count }) {
  if (count < WARN) return null;
  const atLimit = count >= MAX;
  return (
    <span
      className={`text-xs tabular-nums ${atLimit ? "text-red-500" : "text-zinc-500 dark:text-zinc-400"}`}
    >
      {count}/{MAX}
    </span>
  );
}

function Textarea({ label, value, onChange, placeholder }) {
  const atLimit = value.length >= MAX;
  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <div className="flex items-center justify-between px-1">
        <label className="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {label}
        </label>
        <CharCount count={value.length} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX))}
        placeholder={placeholder}
        rows={8}
        style={{ minHeight: "160px" }}
        className={`
          w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed
          bg-zinc-100 dark:bg-zinc-900
          text-zinc-900 dark:text-zinc-100
          placeholder:text-zinc-400 dark:placeholder:text-zinc-600
          border transition-colors outline-none
          ${
            atLimit
              ? "border-red-500/60 focus:border-red-500"
              : "border-zinc-200 dark:border-zinc-800 focus:border-[#7c5cfc]"
          }
        `}
      />
    </div>
  );
}

export function InputScreen({ onSubmit }) {
  const [sideA, setSideA] = useState("");
  const [sideB, setSideB] = useState("");
  const { theme, setTheme } = useTheme();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const isDisabled = sideA.trim().length === 0 && sideB.trim().length === 0;

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (isDisabled) return;
    onSubmit(sideA, sideB);
  }

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 flex flex-col transition-colors duration-200">
      <div className="flex-1 flex justify-center items-center">
      <div className="w-full max-w-[480px] flex flex-col px-5 py-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            settle it
            <span style={{ color: "#7c5cfc" }}>.</span>
          </h1>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
          <div className="flex gap-3">
            <Textarea
              label="your side"
              value={sideA}
              onChange={setSideA}
              placeholder="I said we agreed to leave at 8..."
            />
            <Textarea
              label="their side"
              value={sideB}
              onChange={setSideB}
              placeholder="She knew I needed more time..."
            />
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            className={`
              w-full py-4 rounded-xl text-base font-semibold text-white
              transition-all duration-150
              ${
                isDisabled
                  ? "opacity-30 cursor-not-allowed bg-[#7c5cfc]"
                  : "bg-[#7c5cfc] hover:brightness-110 active:scale-[0.98]"
              }
            `}
          >
            settle it
          </button>
        </form>
      </div>
      </div>

      <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 pb-20 px-5">
        verdicts are AI-generated for fun — not actual advice.
      </p>
    </div>
  );
}
