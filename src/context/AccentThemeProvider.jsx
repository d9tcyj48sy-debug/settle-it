import { useEffect, useState } from "react";
import { getAccentTheme, setAccentTheme as saveAccentTheme } from "../services/storageService";
import { AccentThemeContext } from "./AccentThemeContext";

function applyAccent(theme) {
  if (theme === "purple") {
    delete document.documentElement.dataset.accent;
  } else {
    document.documentElement.dataset.accent = theme;
  }
}

export function AccentThemeProvider({ children }) {
  const [accentTheme, setAccentState] = useState(getAccentTheme);

  useEffect(() => {
    applyAccent(accentTheme);
  }, [accentTheme]);

  function setAccentTheme(next) {
    saveAccentTheme(next);
    setAccentState(next);
  }

  return (
    <AccentThemeContext.Provider value={{ accentTheme, setAccentTheme }}>
      {children}
    </AccentThemeContext.Provider>
  );
}
