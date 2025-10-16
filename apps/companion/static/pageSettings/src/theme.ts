import { createTheme } from "@mui/material/styles";

export type ThemePreference = "light" | "dark" | "system";

export function buildTheme(mode: "light" | "dark") {
  return createTheme({
    palette: {
      mode,
      background: {
        default: mode === "dark" ? "#141a1a" : "#ffffff",
        paper: mode === "dark" ? "#141a1a" : "#ffffff",
      },
      primary: { main: "#4caf50" },
      secondary: { main: "#90caf9" },
      text: {
        primary: mode === "dark" ? "#e5eceb" : "#213547",
        secondary: mode === "dark" ? "#9fb0ad" : "#5c6b6b",
      },
    },
    typography: {
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      body1: { fontSize: 14 },
    },
  });
}

export function getSystemMode(): "light" | "dark" {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
