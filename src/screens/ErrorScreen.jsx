import { pressIn, pressOut } from "../utils/touch";

const ERROR_COPY = {
  rate_limited: "easy there — come back in a bit.",
  content_rejected: "we don't settle that kind of thing here.",
  api_unavailable: "the jury's stepped out — try again?",
  invalid_request: "give us something to work with.",
  unknown: "something went sideways — try again?",
};

function AlertIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function ErrorScreen({ errorType, onRetry, onStartOver }) {
  const message = ERROR_COPY[errorType] ?? ERROR_COPY.unknown;
  const canRetry =
    errorType !== "content_rejected" && errorType !== "invalid_request";

  return (
    <div
      className="min-h-[100dvh] bg-white dark:bg-zinc-950 flex justify-center items-center transition-colors duration-200"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="w-full max-w-[480px] flex flex-col items-center px-5 py-10 pb-28 gap-8 text-center">
        <span className="text-zinc-400 dark:text-zinc-600">
          <AlertIcon />
        </span>

        <p className="text-lg font-medium text-zinc-900 dark:text-white leading-snug">
          {message}
        </p>

        <div className="flex flex-col gap-3 w-full">
          {canRetry && (
            <button
              onClick={onRetry}
              onTouchStart={pressIn}
              onTouchEnd={pressOut}
              onTouchCancel={pressOut}
              className="w-full py-4 rounded-xl text-base font-semibold bg-[var(--accent)] text-white hover:brightness-110 transition-all duration-150"
            >
              retry
            </button>
          )}
          <button
            onClick={onStartOver}
            onTouchStart={pressIn}
            onTouchEnd={pressOut}
            onTouchCancel={pressOut}
            className="w-full py-4 rounded-xl text-base font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            start over
          </button>
        </div>
      </div>
    </div>
  );
}
