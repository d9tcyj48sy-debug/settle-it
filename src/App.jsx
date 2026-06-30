import { useEffect, useRef, useState } from "react";
import { InputScreen } from "./screens/InputScreen";
import { LoadingScreen } from "./screens/LoadingScreen";
import { VerdictScreen } from "./screens/VerdictScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { ErrorScreen } from "./screens/ErrorScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { BottomNav } from "./components/BottomNav";
import { getVerdict } from "./services/verdictService";
import { addVerdict, updateStreak } from "./services/storageService";
import "./App.css";

const MIN_LOADING_MS = 1500;
const FADE_MS = 150;

function SplashScreen({ onComplete }) {
  const cb = useRef(onComplete);
  useEffect(() => {
    const timer = setTimeout(() => cb.current(), 1050);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="splash-anim min-h-[100dvh] bg-white dark:bg-[#0e0e0f] flex items-center justify-center">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
        settle it<span style={{ color: "#7c5cfc" }}>.</span>
      </h1>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: "rgba(0, 0, 0, 0.5)" }}
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
              background: "linear-gradient(to bottom, #8463f7, #7350ed)",
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

export default function App() {
  const [screen, setScreen] = useState("splash");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [error, setError] = useState(null);
  const [lastSides, setLastSides] = useState({ sideA: "", sideB: "" });
  const [argueBetter, setArgueBetter] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const transitionRef = useRef(null);
  const inputDirtyCheckRef = useRef(null);

  function navigate(nextScreen, setupFn) {
    if (transitionRef.current) clearTimeout(transitionRef.current);
    setIsTransitioning(true);
    transitionRef.current = setTimeout(() => {
      setupFn?.();
      setScreen(nextScreen);
      setIsTransitioning(false);
      transitionRef.current = null;
    }, FADE_MS);
  }

  async function handleSubmit(sideA, sideB) {
    setLastSides({ sideA, sideB });
    navigate("loading");
    const start = Date.now();
    const result = await getVerdict(sideA, sideB);
    const elapsed = Date.now() - start;
    if (elapsed < MIN_LOADING_MS) {
      await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
    }
    if (result.error) {
      navigate("error", () => setError(result));
    } else {
      const won = result.sideAPercentage > 50;
      const fullVerdict = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        won,
        ...result,
      };
      addVerdict(fullVerdict);
      updateStreak(won);
      navigate("verdict", () => setVerdict(fullVerdict));
    }
  }

  function handleArgueBetter() {
    navigate("input", () => {
      setArgueBetter({
        sideA: lastSides.sideA,
        sideB: lastSides.sideB,
        topicLabel: verdict.topicLabel,
        round: argueBetter ? argueBetter.round + 1 : 2,
      });
    });
  }

  function handleHistoryNav() {
    if (screen === "input" && argueBetter && inputDirtyCheckRef.current?.()) {
      setConfirmModal({
        title: "discard your edits?",
        message: "you'll lose your changes to the arguments",
        confirmLabel: "discard",
        cancelLabel: "keep editing",
        onConfirm: () => {
          setConfirmModal(null);
          navigate("history", () => setArgueBetter(null));
        },
      });
      return;
    }
    if (screen === "verdict") {
      setConfirmModal({
        title: "leave this verdict?",
        message: "you'll lose the option to argue better for this round",
        confirmLabel: "leave",
        cancelLabel: "stay",
        onConfirm: () => {
          setConfirmModal(null);
          navigate("history");
        },
      });
      return;
    }
    navigate("history");
  }

  function handleStartOver() {
    navigate("input", () => {
      setVerdict(null);
      setError(null);
      setLastSides({ sideA: "", sideB: "" });
      setArgueBetter(null);
    });
  }

  function handleOpenSettings() {
    navigate("settings");
  }

  function handleCloseSettings() {
    navigate("input");
  }

  const showNav = screen !== "loading" && screen !== "splash" && screen !== "settings";
  const activeTab = screen === "history" ? "history" : "settle";

  return (
    <>
      <div
        style={{
          opacity: isTransitioning ? 0 : 1,
          transition: `opacity ${FADE_MS}ms ease`,
        }}
      >
        {screen === "splash" && <SplashScreen onComplete={() => setScreen("input")} />}
        {screen === "input" && <InputScreen onSubmit={handleSubmit} argueBetter={argueBetter} dirtyCheckRef={inputDirtyCheckRef} onOpenSettings={handleOpenSettings} />}
        {screen === "settings" && <SettingsScreen onBack={handleCloseSettings} />}
        {screen === "loading" && <LoadingScreen />}
        {screen === "verdict" && (
          <VerdictScreen
            verdict={verdict}
            onNewSettle={handleStartOver}
            onArgueBetter={handleArgueBetter}
          />
        )}
        {screen === "history" && <HistoryScreen />}
        {screen === "error" && (
          <ErrorScreen
            errorType={error?.errorType ?? "unknown"}
            onRetry={() => handleSubmit(lastSides.sideA, lastSides.sideB)}
            onStartOver={handleStartOver}
          />
        )}
      </div>

      {showNav && (
        <BottomNav
          activeTab={activeTab}
          onSettle={() => navigate("input", () => setArgueBetter(null))}
          onHistory={handleHistoryNav}
        />
      )}
      {confirmModal && (
        <ConfirmModal
          {...confirmModal}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </>
  );
}
