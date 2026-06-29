import { useState } from "react";
import { InputScreen } from "./screens/InputScreen";
import { LoadingScreen } from "./screens/LoadingScreen";
import { getVerdict } from "./services/verdictService";
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
      setVerdict(result);
      setScreen("verdict");
    }
  }

  if (screen === "input") {
    return <InputScreen onSubmit={handleSubmit} />;
  }

  if (screen === "loading") {
    return <LoadingScreen />;
  }

  if (screen === "verdict") {
    return (
      <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 flex items-center justify-center p-5">
        <div className="text-zinc-900 dark:text-white max-w-[480px] w-full">
          <p className="text-sm text-zinc-500 mb-2">{verdict?.topicLabel}</p>
          <p className="text-4xl font-bold mb-1">
            {verdict?.sideAPercentage}
            <span className="text-zinc-500 text-2xl">%</span>
          </p>
          <p className="text-base leading-relaxed mb-6">{verdict?.ruling}</p>
          <button
            onClick={() => setScreen("input")}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            ← back
          </button>
        </div>
      </div>
    );
  }

  if (screen === "error") {
    return (
      <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 flex items-center justify-center p-5">
        <div className="text-center max-w-[480px] w-full">
          <p className="text-zinc-900 dark:text-white mb-2">
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
    );
  }

  return null;
}
