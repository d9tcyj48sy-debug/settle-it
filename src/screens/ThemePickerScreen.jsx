import { ChevronLeftIcon, CheckIcon } from "../components/Icons";

function ColorSwatch({ color }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2 px-1">
      {children}
    </p>
  );
}

export function ThemePickerScreen({ onBack }) {
  return (
    <div
      className="min-h-[100dvh] bg-white dark:bg-zinc-950 flex flex-col transition-colors duration-200"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex-1 max-w-[480px] w-full mx-auto px-5 pt-6 pb-10">
        {/* Header */}
        <header className="flex items-center gap-3 mb-10">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="p-2 -ml-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            style={{ background: "none", border: "none", WebkitTapHighlightColor: "transparent" }}
          >
            <ChevronLeftIcon size={20} />
          </button>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            choose a theme
          </h1>
        </header>

        <section>
          <SectionLabel>choose a theme</SectionLabel>
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Default purple — only theme, always selected */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <ColorSwatch color="#7c5cfc" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">default purple</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">free</p>
              </div>
              <span style={{ color: "#7c5cfc" }}>
                <CheckIcon size={16} />
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
