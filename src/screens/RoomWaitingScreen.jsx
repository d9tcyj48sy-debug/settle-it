import { useState, useEffect } from "react";
import { ChevronLeftIcon, ShareIcon, CheckIcon } from "../components/Icons";
import { pressIn, pressOut, textPressIn, textPressOut } from "../utils/touch";
import { cancelRoom, submitCreatorSide } from "../services/roomService";

const MAX = 500;
const WARN = 450;

function formatExpiry(expiresAt) {
  const ms = new Date(expiresAt) - Date.now();
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`;
}

export function RoomWaitingScreen({ room, onCancel }) {
  const [mySide, setMySide] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => formatExpiry(room.expires_at));

  const roomUrl = `${window.location.origin}/room/${room.short_code}`;

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(formatExpiry(room.expires_at)), 60000);
    return () => clearInterval(id);
  }, [room.expires_at]);

  async function handleCopy() {
    try { await navigator.clipboard.writeText(roomUrl); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ url: roomUrl, title: "Join my Settle It room" });
        return;
      } catch { /* user cancelled or unsupported — fall through to copy */ }
    }
    await handleCopy();
  }

  async function handleCancel() {
    setCancelling(true);
    try { await cancelRoom(room.id); } catch { /* ignore — navigate back regardless */ }
    onCancel();
  }

  async function handleSubmit() {
    if (!mySide.trim() || submitting || submitted) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitCreatorSide(room.id, mySide.trim());
      setSubmitted(true);
    } catch {
      setSubmitError("couldn't save your side, try again");
    } finally {
      setSubmitting(false);
    }
  }

  const atLimit = mySide.length >= MAX;
  const nearLimit = mySide.length >= WARN;
  const canSubmit = mySide.trim().length > 0 && !submitted && !submitting;

  return (
    <div
      className="min-h-[100dvh] bg-white dark:bg-[#0e0e0f] flex flex-col transition-colors duration-200"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="max-w-[480px] w-full mx-auto px-5 pt-6 pb-10 flex flex-col gap-6">

        {/* Header */}
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            aria-label="Cancel room"
            onTouchStart={pressIn}
            onTouchEnd={pressOut}
            onTouchCancel={pressOut}
            className="p-2 -ml-2 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors"
            style={{ background: "none", border: "none", WebkitTapHighlightColor: "transparent" }}
          >
            <ChevronLeftIcon size={20} />
          </button>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            live settle
          </h1>
        </header>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {submitted
              ? "your side submitted — waiting for your opponent…"
              : "waiting for your opponent to join…"}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">{timeLeft}</p>
        </div>

        {/* Challenge link */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 px-1">
            challenge link
          </p>
          <div className="rounded-xl bg-zinc-100 dark:bg-[#1a1a1f] border border-zinc-200 dark:border-[#333338] px-4 py-3">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate" style={{ fontVariantNumeric: "tabular-nums" }}>
              {roomUrl}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              onTouchStart={pressIn}
              onTouchEnd={pressOut}
              onTouchCancel={pressOut}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#333338] bg-zinc-50 dark:bg-[#1a1a1f] text-sm font-medium text-zinc-900 dark:text-zinc-100"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {copied ? (
                <><CheckIcon size={14} /> copied!</>
              ) : (
                "copy link"
              )}
            </button>
            <button
              type="button"
              onClick={handleShare}
              onTouchStart={pressIn}
              onTouchEnd={pressOut}
              onTouchCancel={pressOut}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#333338] bg-zinc-50 dark:bg-[#1a1a1f] text-sm font-medium text-zinc-900 dark:text-zinc-100"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <ShareIcon size={14} /> share
            </button>
          </div>
        </div>

        {/* Your side */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              your side
            </label>
            {!submitted && (
              <span
                className={`text-xs tabular-nums ${
                  atLimit
                    ? "text-red-500"
                    : nearLimit
                    ? "text-amber-500"
                    : "text-zinc-400 dark:text-zinc-600"
                }`}
              >
                {mySide.length}/{MAX}
              </span>
            )}
          </div>
          <textarea
            ref={(el) => el?.setAttribute("autocapitalize", "sentences")}
            value={mySide}
            onChange={submitted ? undefined : (e) => setMySide(e.target.value.slice(0, MAX))}
            placeholder={submitted ? "" : "write your side of the argument…"}
            readOnly={submitted}
            autoCorrect="on"
            spellCheck={true}
            inputMode="text"
            rows={6}
            style={{ minHeight: "140px", touchAction: "manipulation" }}
            className={`
              w-full resize-none rounded-xl px-4 py-3 text-base leading-relaxed
              bg-zinc-100 dark:bg-[#1a1a1f]
              text-zinc-900 dark:text-zinc-100
              placeholder:text-zinc-400 dark:placeholder:text-zinc-600
              border transition-colors outline-none
              ${
                submitted
                  ? "opacity-60 cursor-default border-zinc-200 dark:border-[#333338]"
                  : atLimit
                  ? "border-red-500/60 focus:border-red-500"
                  : "border-zinc-200 dark:border-[#333338] focus:border-[var(--accent)]"
              }
            `}
          />
        </div>

        {/* Submit */}
        {submitError && (
          <p className="text-sm text-center text-red-500 -mt-3">{submitError}</p>
        )}
        <button
          type="button"
          onClick={canSubmit ? handleSubmit : undefined}
          disabled={!canSubmit && !submitted}
          onTouchStart={canSubmit ? pressIn : undefined}
          onTouchEnd={pressOut}
          onTouchCancel={pressOut}
          className={`w-full py-4 rounded-xl text-base font-semibold transition-all duration-150 flex items-center justify-center gap-2 ${
            submitted
              ? "border text-white"
              : !canSubmit
              ? "opacity-30 cursor-not-allowed text-white bg-[var(--accent)]"
              : "text-white bg-[var(--accent)] hover:brightness-110"
          }`}
          style={
            submitted
              ? {
                  background: "var(--accent-dim)",
                  borderColor: "var(--accent-border)",
                  color: "var(--accent)",
                  WebkitTapHighlightColor: "transparent",
                }
              : { WebkitTapHighlightColor: "transparent" }
          }
        >
          {submitted ? (
            <><CheckIcon size={18} /> side submitted</>
          ) : submitting ? (
            "saving…"
          ) : (
            "submit your side"
          )}
        </button>

        {/* Cancel room */}
        <button
          type="button"
          onClick={handleCancel}
          disabled={cancelling}
          onTouchStart={textPressIn}
          onTouchEnd={textPressOut}
          onTouchCancel={textPressOut}
          className="text-sm text-red-500 text-center py-2 -mt-3"
          style={{ background: "none", border: "none", WebkitTapHighlightColor: "transparent" }}
        >
          {cancelling ? "cancelling…" : "cancel room"}
        </button>

      </div>
    </div>
  );
}
