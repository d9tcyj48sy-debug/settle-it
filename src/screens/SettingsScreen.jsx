import { useState } from "react";
import { useTheme } from "../context/useTheme";
import { useAccentTheme } from "../context/useAccentTheme";
import { pressIn, pressOut } from "../utils/touch";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SunIcon,
  VolumeIcon,
  ShieldIcon,
  TrashIcon,
} from "../components/Icons";
import {
  clearHistory,
  getSoundPreference,
  setSoundPreference,
  resetStreak,
} from "../services/storageService";

const BRIGHTNESS_OPTIONS = ["system", "light", "dark"];

function BrightnessControl({ theme, onSetTheme }) {
  return (
    <div
      className="flex rounded-lg bg-zinc-200 dark:bg-zinc-800 p-0.5 gap-0.5"
      role="group"
      aria-label="Brightness"
    >
      {BRIGHTNESS_OPTIONS.map((opt) => {
        const active = theme === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSetTheme(opt)}
            onTouchStart={pressIn}
            onTouchEnd={pressOut}
            onTouchCancel={pressOut}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
              active
                ? "bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      onTouchStart={pressIn}
      onTouchEnd={pressOut}
      onTouchCancel={pressOut}
      className={on ? "" : "bg-zinc-300 dark:bg-zinc-600"}
      style={{
        position: "relative",
        width: 44,
        height: 26,
        borderRadius: 13,
        background: on ? "var(--accent)" : undefined,
        transition: "background 200ms",
        border: "none",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: on ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.28)",
          transition: "left 200ms",
          display: "block",
        }}
      />
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2 px-1">
      {children}
    </p>
  );
}

function SettingRow({ icon, label, right }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-zinc-500 dark:text-zinc-400 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
      </div>
      {right}
    </div>
  );
}

function Card({ children }) {
  return (
    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
      {children}
    </div>
  );
}

function TappableRow({ icon, label, subtitle, right, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onTouchStart={pressIn}
      onTouchEnd={pressOut}
      onTouchCancel={pressOut}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <span className={`shrink-0 ${danger ? "text-red-500" : "text-zinc-500 dark:text-zinc-400"}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? "text-red-500" : "text-zinc-900 dark:text-zinc-100"}`}>
          {label}
        </p>
        {subtitle && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <span className="text-zinc-400 dark:text-zinc-500 shrink-0">{right}</span>
    </button>
  );
}

function ConfirmModal({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[320px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#28282e] rounded-2xl p-5 flex flex-col gap-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</p>
          {message && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{message}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 border border-zinc-200 dark:border-[#28282e] text-zinc-700 dark:text-zinc-300 bg-transparent active:opacity-70 transition-opacity duration-100"
            style={{ borderRadius: "14px", padding: "12px", fontSize: "12.5px", fontWeight: 500 }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 text-white active:brightness-90 transition-all duration-100"
            style={{
              background: "linear-gradient(to bottom, var(--accent-g-from), var(--accent-g-to))",
              borderRadius: "14px",
              padding: "12px",
              fontSize: "12.5px",
              fontWeight: 500,
            }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ColorSwatch({ color }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

const ACCENT_LABELS = { purple: "default purple", forest: "forest green" };

export function SettingsScreen({ onBack, onOpenThemePicker, onOpenPrivacy }) {
  const { theme, setTheme } = useTheme();
  const { accentTheme } = useAccentTheme();
  const [sound, setSound] = useState(getSoundPreference);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cleared, setCleared] = useState(false);

  function handleSoundToggle() {
    const next = !sound;
    setSoundPreference(next);
    setSound(next);
  }

  function handleClearConfirm() {
    clearHistory();
    resetStreak();
    setShowConfirm(false);
    setCleared(true);
    setTimeout(() => setCleared(false), 2500);
  }

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
            onTouchStart={pressIn}
            onTouchEnd={pressOut}
            onTouchCancel={pressOut}
            className="p-2 -ml-2 rounded-lg text-zinc-500 dark:text-zinc-400 active:text-zinc-900 dark:active:text-white active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors"
            style={{ background: "none", border: "none", WebkitTapHighlightColor: "transparent" }}
          >
            <ChevronLeftIcon size={20} />
          </button>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            settings
          </h1>
        </header>

        <div className="flex flex-col gap-6">
          {/* Appearance */}
          <section>
            <SectionLabel>appearance</SectionLabel>
            <Card>
              <div className="px-4 py-3.5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 dark:text-zinc-400 shrink-0">
                    <SunIcon size={18} />
                  </span>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">brightness</p>
                </div>
                <BrightnessControl theme={theme} onSetTheme={setTheme} />
              </div>
            </Card>
          </section>

          {/* Theme */}
          <section>
            <SectionLabel>theme</SectionLabel>
            <Card>
              <TappableRow
                icon={<ColorSwatch color="var(--accent)" />}
                label={ACCENT_LABELS[accentTheme] ?? "default purple"}
                subtitle="2 themes available"
                right={<ChevronRightIcon size={16} />}
                onClick={onOpenThemePicker}
              />
            </Card>
          </section>

          {/* Sound */}
          <section>
            <SectionLabel>sound</SectionLabel>
            <Card>
              <SettingRow
                icon={<VolumeIcon size={18} />}
                label="sound effects"
                right={<Toggle on={sound} onToggle={handleSoundToggle} />}
              />
            </Card>
          </section>

          {/* Data */}
          <section>
            <SectionLabel>data</SectionLabel>
            <Card>
              <TappableRow
                icon={<span style={{ color: "var(--accent)" }}><ShieldIcon size={18} /></span>}
                label="privacy policy"
                right={<ChevronRightIcon size={16} />}
                onClick={onOpenPrivacy}
              />
              <TappableRow
                icon={<TrashIcon size={18} />}
                label={cleared ? "history cleared" : "clear all history"}
                danger={!cleared}
                right={<ChevronRightIcon size={16} />}
                onClick={cleared ? undefined : () => setShowConfirm(true)}
              />
            </Card>
          </section>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          title="clear all history?"
          message="this will permanently delete all your verdicts and reset your win streak to zero."
          confirmLabel="clear everything"
          cancelLabel="keep it"
          onConfirm={handleClearConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
