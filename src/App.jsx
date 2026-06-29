import { useState } from "react";
import { InputScreen } from "./screens/InputScreen";
import { LoadingScreen } from "./screens/LoadingScreen";
import { VerdictScreen } from "./screens/VerdictScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { BottomNav } from "./components/BottomNav";
import { getVerdict } from "./services/verdictService";
import { addVerdict, updateStreak } from "./services/storageService";
import "./App.css";

const MIN_LOADING_MS = 1500;

export default function App() {
  const [screen, setScreen] = useState("input");
  const [verdict, setVerdict] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(sideA, sideB) {
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

  const showNav = screen !== "loading";
  const activeTab = screen === "history" ? "history" : "settle";

  return (
    <>
      {screen === "input" && <InputScreen onSubmit={handleSubmit} />}
      {screen === "loading" && <LoadingScreen />}
      {screen === "verdict" && (
        <VerdictScreen
          verdict={verdict}
          onNewSettle={() => {
            setVerdict(null);
            setScreen("input");
          }}
        />
      )}
      {screen === "history" && <HistoryScreen />}
      {screen === "error" && (
        <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 flex items-center justify-center p-5 pb-24">
          <div className="text-center max-w-[480px] w-full">
            <p className="text-zinc-900 dark:text-white mb-4">
              {error?.message ?? "Something went wrong."}
            </p>
            <button
              onClick={() => setScreen("input")}
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              ← try again
            </button>
          </div>
        </div>
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
