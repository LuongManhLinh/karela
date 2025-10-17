import { useEffect, useState } from "react";
import { Box, xcss, Flex } from "@atlaskit/primitives";
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
import Button from "@atlaskit/button";

const appRootStyles = xcss({
  display: "flex",
});

const progressContainerStyles = xcss({
  position: "fixed",
  top: "0px",
  left: "0px",
  right: "0px",
  zIndex: "modal",
});

function App() {
  const [data, setData] = useState<DefectResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hadError, setHadError] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);

  const [message, setMessage] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const fetchData = () => {
    setIsRunning(true);
    setMessage("Analyzing…");
    setHistory([]);
    try {
      Api.fetchDefectAnalysis().then((result) => {
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
              ]
            : []
        );
        console.log("Fetched report data:", result.data?.report.content);
      });
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

  const toggle = (id: string) => {
    setSuggestions((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((item) => item.id === id);
      if (idx === -1) return prev;
      updated[idx] = { ...updated[idx], done: !updated[idx].done };
      return updated;
    });
  };

  const completeAll = () => {
    setSuggestions((prev) => {
      return prev.map((item) => ({ ...item, done: true }));
    });
    setToast("All suggestions marked as done");
  };

  return (
    <Flex direction="row" xcss={appRootStyles}>
      <Button onClick={fetchData}>Fetch Data</Button>
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
      <RightPanel
        markdown={data?.report.content || ""}
        suggestions={suggestions}
        onToggle={toggle}
        onCompleteAll={completeAll}
        isRunning={isRunning}
        hadError={hadError}
        onRetry={() => {
          fetchData();
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
    </Flex>
  );
}

export default App;
