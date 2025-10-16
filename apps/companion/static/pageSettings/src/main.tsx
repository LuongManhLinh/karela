import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { buildTheme, getSystemMode } from "./theme";
import "./index.css";
import App from "./App";

const effectiveMode = getSystemMode();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={buildTheme(effectiveMode)}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);
