import { useEffect, useState } from "react";
import { Box, xcss } from "@atlaskit/primitives";
import ProgressBar from "@atlaskit/progress-bar";
import Flag, { FlagGroup } from "@atlaskit/flag";
import SuccessIcon from "@atlaskit/icon/glyph/check-circle";
import LeftPanel from "./components/LeftPanel";
import RightPanel from "./components/RightPanel";
import { Api } from "./services/api";
import {
  type SuggestionItem,
  type DefectResponse,
  type HistoryItem,
} from "./types";
import ThemeSelector from "./components/ThemeSelector";
import { getSystemMode, type ThemePreference, applyTheme } from "./theme";
import "./App.css";

const appRootStyles = xcss({
  position: "relative",
  display: "flex",
  height: "100vh",
});

const progressContainerStyles = xcss({
  position: "fixed",
  top: "0px",
  left: "0px",
  right: "0px",
  zIndex: "modal",
});

const themeSelectorContainerStyles = xcss({
  position: "absolute",
  left: "space.100",
  bottom: "space.100",
  width: "304px",
});

function App() {
  const [data, setData] = useState<DefectResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hadError, setHadError] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [themePref, setThemePref] = useState<ThemePreference>(
    () => (localStorage.getItem("themePref") as ThemePreference) || "system"
  );

  const [message, setMessage] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const fetchData = async () => {
    setIsRunning(true);
    setMessage("Analyzing…");
    setHistory([]);
    try {
      const result = await Api.fetchDefectAnalysis();
      setData(result.data);
      setHadError(result.hadError);
      setSuggestions(
        result.data?.report.suggestions.map((text, i) => ({
          id: `s${i + 1}`,
          text,
          done: false,
        })) || []
      );
      setMessage(result.data?.notification);
      setHistory(
        result.data
          ? [
              {
                id: "h1",
                title: result.data.report.title,
                timestamp: new Date().toISOString(),
              },
              ...history,
            ]
          : []
      );
    } catch (e) {
      setHadError(true);
      setMessage("Failed to analyze. Please try again.");
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem("themePref", themePref);
  }, [themePref]);

  const effectiveMode = themePref === "system" ? getSystemMode() : themePref;

  useEffect(() => {
    applyTheme(effectiveMode);
  }, [effectiveMode]);

  const toggle = async (id: string) => {
    setSuggestions((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((item) => item.id === id);
      if (idx === -1) return prev;
      updated[idx] = { ...updated[idx], done: !updated[idx].done };
      return updated;
    });
  };

  const completeAll = async () => {
    setSuggestions((prev) => {
      return prev.map((item) => ({ ...item, done: true }));
    });
    setToast("All suggestions marked as done");
  };

  return (
    <Box xcss={appRootStyles}>
      {isRunning && (
        <Box xcss={progressContainerStyles}>
          <ProgressBar isIndeterminate />
        </Box>
      )}
      <LeftPanel
        isRunning={isRunning}
        message={message}
        avatarInitials={"A"}
        history={history}
        onSelectHistory={async (id) => {
          console.log("Select history", id);
        }}
      />
      <Box xcss={themeSelectorContainerStyles}>
        <ThemeSelector value={themePref} onChange={setThemePref} />
      </Box>
      <RightPanel
        markdown={data?.report.content || ""}
        suggestions={suggestions}
        onToggle={toggle}
        onCompleteAll={completeAll}
        isRunning={isRunning}
        hadError={hadError}
        onRetry={async () => {
          await fetchData();
        }}
      />
      {toast && (
        <FlagGroup onDismissed={() => setToast(null)}>
          <Flag
            icon={<SuccessIcon label="Success" primaryColor="green" />}
            id="success-flag"
            key="success"
            title="Success"
            description={toast}
          />
        </FlagGroup>
      )}
    </Box>
  );
}

export default App;
