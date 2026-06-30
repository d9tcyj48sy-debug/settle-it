import { ScaleIcon, ClockIcon } from "./Icons";
import { pressIn, pressOut } from "../utils/touch";

const ACCENT = "var(--accent)";

function NavTab({ label, active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      onTouchStart={pressIn}
      onTouchEnd={pressOut}
      onTouchCancel={pressOut}
      className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors"
      style={{ color: active ? ACCENT : undefined }}
    >
      <span className={active ? "" : "text-zinc-400 dark:text-zinc-600"}>
        {children}
      </span>
      <span
        className="w-1.5 h-1.5 rounded-full transition-opacity"
        style={{
          backgroundColor: ACCENT,
          opacity: active ? 1 : 0,
        }}
      />
    </button>
  );
}

export function BottomNav({ activeTab, onSettle, onHistory }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-center bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800">
      <div className="w-full max-w-[480px] flex">
        <NavTab label="Settle" active={activeTab === "settle"} onClick={onSettle}>
          <ScaleIcon size={22} />
        </NavTab>
        <NavTab label="History" active={activeTab === "history"} onClick={onHistory}>
          <ClockIcon size={22} />
        </NavTab>
      </div>
    </nav>
  );
}
