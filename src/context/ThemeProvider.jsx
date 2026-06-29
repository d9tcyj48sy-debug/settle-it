import { useEffect, useState } from "react";
import {
  getThemePreference,
  setThemePreference,
} from "../services/storageService";
import { ThemeContext } from "./ThemeContext";

function resolveIsDark(preference) {
  if (preference === "dark") return true;
  if (preference === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getThemePreference);

  useEffect(() => {
    const apply = () => {
      document.documentElement.classList.toggle("dark", resolveIsDark(theme));
    };

    apply();

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  function setTheme(next) {
    setThemePreference(next);
    setThemeState(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
