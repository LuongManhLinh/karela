export const setGherkinEditorTheme = (theme: string) => {
  localStorage.setItem("gherkinEditorTheme", theme);
};

export const getGherkinEditorTheme = (): string => {
  return localStorage.getItem("gherkinEditorTheme") || "jira";
};
