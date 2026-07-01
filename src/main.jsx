import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeProvider.jsx";
import { AccentThemeProvider } from "./context/AccentThemeProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AccentThemeProvider>
          <App />
        </AccentThemeProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
