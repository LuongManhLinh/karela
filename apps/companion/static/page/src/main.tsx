import { StrictMode } from "react";
import "@atlaskit/css-reset";
import { setGlobalTheme } from "@atlaskit/tokens";
import App from "./App";
// import ForgeReconciler from "@forge/react";
import { createRoot } from "react-dom/client";

// Initialize Atlaskit theme
setGlobalTheme({
  colorMode: "auto",
  typography: "typography-modernized",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
