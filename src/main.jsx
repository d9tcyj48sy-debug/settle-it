import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeProvider.jsx";
import { AccentThemeProvider } from "./context/AccentThemeProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AccentThemeProvider>
        <App />
      </AccentThemeProvider>
    </ThemeProvider>
  </StrictMode>,
);
