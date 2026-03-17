export const getThemeName = () => {
  if (typeof window === "undefined") {
    return "green-theme.json";
  }

  const storedTheme = localStorage.getItem("themePath");

  if (!storedTheme) {
    return "green-theme.json";
  }

  return storedTheme.endsWith(".json") ? storedTheme : `${storedTheme}.json`;
};

export const setThemeName = (themeName: string) => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem("themePath", themeName);
  window.dispatchEvent(new Event("theme-change"));
};
