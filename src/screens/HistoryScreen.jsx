import { useEffect, useState } from "react";
import { getHistory, getStreak } from "../services/storageService";
import { ChevronDownIcon } from "../components/Icons";

function formatDate(isoString) {
  const date = new Date(isoString);
  const diffDays = Math.floor((Date.now() - date) / 86_400_000);
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: "short" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StreakCard({ streak }) {
  return (
    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex overflow-hidden">
      <div className="flex-1 flex flex-col items-center py-4 gap-1">
        <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          current streak
        </span>
        <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-white">
          {streak.current > 0 ? "🔥 " : ""}
          {streak.current}
        </span>
      </div>
      <div className="w-px bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex-1 flex flex-col items-center py-4 gap-1">
        <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          personal best
        </span>
        <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-white">
          {streak.best}
        </span>
      </div>
    </div>
  );
}

function HistoryEntry({ entry, isExpanded, onToggle }) {
  const { topicLabel, createdAt, sideAPercentage, ruling, won } = entry;

  return (
    <button
      onClick={onToggle}
      className="w-full text-left rounded-xl px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-zinc-900 dark:text-white leading-snug flex-1">
          {topicLabel}
        </span>
        <span className="text-xs text-zinc-400 shrink-0 mt-0.5">
          {formatDate(createdAt)}
        </span>
      </div>

      {/* Score row */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span
            className="text-lg font-bold tabular-nums"
            style={{ color: won ? "#7c5cfc" : undefined }}
          >
            <span className={won ? "" : "text-red-500"}>{sideAPercentage}%</span>
          </span>
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              won
                ? "bg-[#7c5cfc]/10 text-[#7c5cfc]"
                : "bg-red-500/10 text-red-500"
            }`}
          >
            {won ? "won" : "lost"}
          </span>
        </div>
        <span
          className="text-zinc-400 transition-transform duration-300"
          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <ChevronDownIcon />
        </span>
      </div>

      {/* Ruling — expands inline */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isExpanded ? "300px" : "0px" }}
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-800">
          {ruling}
        </p>
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="text-4xl mb-4">⚖️</span>
      <p className="text-base font-semibold text-zinc-900 dark:text-white mb-1">
        no arguments settled yet.
      </p>
      <p className="text-sm text-zinc-500">got beef with someone?</p>
    </div>
  );
}

export function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    setHistory(getHistory());
    setStreak(getStreak());
  }, []);

  function toggleEntry(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 transition-colors duration-200">
      <div className="max-w-[480px] mx-auto px-5 py-6 pb-24">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white mb-6">
          settle it<span style={{ color: "#7c5cfc" }}>.</span>
        </h1>

        <StreakCard streak={streak} />

        {history.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-2 mt-6">
            {history.map((entry) => (
              <HistoryEntry
                key={entry.id}
                entry={entry}
                isExpanded={expandedId === entry.id}
                onToggle={() => toggleEntry(entry.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
