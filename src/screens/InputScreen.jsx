import { useEffect, useState } from "react";
import { GearIcon, HistoryIcon } from "../components/Icons";
import { pressIn, pressOut } from "../utils/touch";

const MAX = 500;
const WARN = 450;

function CharCount({ count }) {
  const atLimit = count >= MAX;
  const nearLimit = count >= WARN;
  return (
    <span
      className={`text-xs tabular-nums ${
        atLimit
          ? "text-red-500"
          : nearLimit
          ? "text-amber-500"
          : "text-zinc-400 dark:text-zinc-600"
      }`}
    >
      {count}/{MAX}
    </span>
  );
}

function Textarea({ label, value, onChange, placeholder, autoFocus }) {
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
        ref={(el) => el?.setAttribute("autocapitalize", "sentences")}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX))}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoCorrect="on"
        spellCheck={true}
        inputMode="text"
        rows={8}
        style={{ minHeight: "160px", touchAction: "manipulation" }}
        className={`
          w-full resize-none rounded-xl px-4 py-3 text-base leading-relaxed
          bg-zinc-100 dark:bg-[#1a1a1f]
          text-zinc-900 dark:text-zinc-100
          placeholder:text-zinc-400 dark:placeholder:text-zinc-600
          border transition-colors outline-none
          ${
            atLimit
              ? "border-red-500/60 focus:border-red-500"
              : "border-zinc-200 dark:border-[#333338] focus:border-[var(--accent)]"
          }
        `}
      />
    </div>
  );
}

export function InputScreen({ onSubmit, argueBetter, dirtyCheckRef, onOpenSettings }) {
  const [sideA, setSideA] = useState(() => argueBetter?.sideA ?? "");
  const [sideB, setSideB] = useState(() => argueBetter?.sideB ?? "");

  // Keep parent's dirty-check ref in sync with the latest field values
  useEffect(() => {
    if (!dirtyCheckRef || !argueBetter) return;
    dirtyCheckRef.current = () =>
      sideA !== argueBetter.sideA || sideB !== argueBetter.sideB;
    return () => { dirtyCheckRef.current = null; };
  }, [sideA, sideB, dirtyCheckRef, argueBetter]);

  const isDisabled = sideA.trim().length === 0 && sideB.trim().length === 0;

  function handleSubmit(e) {
    e.preventDefault();
    if (isDisabled) return;
    onSubmit(sideA, sideB);
  }

  return (
    <div
      className="min-h-[100dvh] bg-white dark:bg-[#0e0e0f] flex flex-col transition-colors duration-200"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex-1 flex justify-center items-center">
        <div className="w-full max-w-[480px] flex flex-col px-5 pt-6 pb-10">
          {/* Header */}
          <header className="flex items-center justify-between mb-10">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              settle it
              <span style={{ color: "var(--accent)" }}>.</span>
            </h1>
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Open settings"
              onTouchStart={pressIn}
              onTouchEnd={pressOut}
              onTouchCancel={pressOut}
              style={{ background: "none", border: "none", WebkitAppearance: "none", WebkitTapHighlightColor: "transparent" }}
              className="bg-transparent border-none p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <GearIcon size={20} />
            </button>
          </header>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
            {argueBetter && (
              <span
                className="inline-flex items-center gap-1 rounded-full self-start"
                style={{
                  fontSize: "11px",
                  padding: "4px 10px",
                  color: "var(--accent)",
                  background: "var(--accent-dim)",
                  border: "1px solid var(--accent-border)",
                }}
              >
                <HistoryIcon size={10} />
                round {argueBetter.round}: {argueBetter.topicLabel}
              </span>
            )}
            <div className="flex gap-3">
              <Textarea
                label="your side"
                value={sideA}
                onChange={setSideA}
                placeholder="I said we agreed to leave at 8..."
                autoFocus={!!argueBetter}
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
              onTouchStart={isDisabled ? undefined : pressIn}
              onTouchEnd={pressOut}
              onTouchCancel={pressOut}
              className={`
              w-full py-4 rounded-xl text-base font-semibold text-white
              transition-all duration-150
              ${
                isDisabled
                  ? "opacity-30 cursor-not-allowed bg-[var(--accent)]"
                  : "bg-[var(--accent)] hover:brightness-110"
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
