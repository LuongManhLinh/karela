export type ThemePreference = "light" | "dark" | "system";

export function getSystemMode(): "light" | "dark" {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(mode: "light" | "dark") {
  document.documentElement.setAttribute("data-color-mode", mode);
  document.body.setAttribute("data-theme", mode);
}
