import { useContext } from "react";
import { AccentThemeContext } from "./AccentThemeContext";

export function useAccentTheme() {
  return useContext(AccentThemeContext);
}
