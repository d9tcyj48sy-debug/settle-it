import { useState } from "react";
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

export default function App() {
  const [screen, setScreen] = useState("input");
  const [verdict, setVerdict] = useState(null);
  const [error, setError] = useState(null);
  const [lastSides, setLastSides] = useState({ sideA: "", sideB: "" });

  async function handleSubmit(sideA, sideB) {
    setLastSides({ sideA, sideB });
    setScreen("loading");
    const start = Date.now();
    const result = await getVerdict(sideA, sideB);
    const elapsed = Date.now() - start;
    if (elapsed < MIN_LOADING_MS) {
      await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
    }
    if (result.error) {
      setError(result);
      setScreen("error");
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
      setVerdict(fullVerdict);
      setScreen("verdict");
    }
  }

  function handleStartOver() {
    setVerdict(null);
    setError(null);
    setLastSides({ sideA: "", sideB: "" });
    setScreen("input");
  }

  const showNav = screen !== "loading";
  const activeTab = screen === "history" ? "history" : "settle";

  return (
    <>
      {screen === "input" && <InputScreen onSubmit={handleSubmit} />}
      {screen === "loading" && <LoadingScreen />}
      {screen === "verdict" && (
        <VerdictScreen
          verdict={verdict}
          onNewSettle={handleStartOver}
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

      {showNav && (
        <BottomNav
          activeTab={activeTab}
          onSettle={() => setScreen("input")}
          onHistory={() => setScreen("history")}
        />
      )}
    </>
  );
}
