import { useRef, useState } from "react";
import { InputScreen } from "./screens/InputScreen";
import { LoadingScreen } from "./screens/LoadingScreen";
import { VerdictScreen } from "./screens/VerdictScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { ErrorScreen } from "./screens/ErrorScreen";
import { BottomNav } from "./components/BottomNav";
import { getVerdict } from "./services/verdictService";
import { addVerdict, updateStreak } from "./services/storageService";
import "./App.css";

const MIN_LOADING_MS = 1500;
const FADE_MS = 150;

export default function App() {
  const [screen, setScreen] = useState("input");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [error, setError] = useState(null);
  const [lastSides, setLastSides] = useState({ sideA: "", sideB: "" });
  const transitionRef = useRef(null);

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

  function handleStartOver() {
    navigate("input", () => {
      setVerdict(null);
      setError(null);
      setLastSides({ sideA: "", sideB: "" });
    });
  }

  const showNav = screen !== "loading";
  const activeTab = screen === "history" ? "history" : "settle";

  return (
    <>
      <div
        style={{
          opacity: isTransitioning ? 0 : 1,
          transition: `opacity ${FADE_MS}ms ease`,
        }}
      >
        {screen === "input" && <InputScreen onSubmit={handleSubmit} />}
        {screen === "loading" && <LoadingScreen />}
        {screen === "verdict" && (
          <VerdictScreen verdict={verdict} onNewSettle={handleStartOver} />
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
          onSettle={() => navigate("input")}
          onHistory={() => navigate("history")}
        />
      )}
    </>
  );
}
