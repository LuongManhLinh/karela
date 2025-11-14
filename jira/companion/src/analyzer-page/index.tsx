import React, { useEffect, useState } from "react";
import ForgeReconciler, {
  Box,
  Button,
  ButtonGroup,
  Inline,
  ProgressBar,
  Text,
  Icon,
  Tabs,
  TabList,
  TabPanel,
  Tab,
} from "@forge/react";
import HistorySidebar from "./components/HistorySidebar";
import { AnalysisSummary, AnalysisDetailDto } from "./types/defect";
import { MockDefectService as DefectService } from "./services/defectService";
import ProjectService from "./services/projectService";
import ReportPanel from "./components/ReportPanel";
import DefectSidebar from "./components/DefectSidebar";
import { ChatPanel } from "../chat-panel";

const AnalyzerPanel = () => {
  const [analysisBriefs, setAnalysisBriefs] = useState<AnalysisSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [loadingId, setLoadingId] = useState<string | undefined>(undefined);
  const [analysisDetails, setAnalysisDetails] =
    useState<AnalysisDetailDto | null>(null);
  const [polling, setPolling] = useState<boolean>(false);

  const [initLoading, setInitLoading] = useState<boolean>(true);

  const [defaultBoardUrl, setDefaultBoardUrl] = useState<string | null>(null);

  const fetchBriefs = () => {
    DefectService.getAllDefectAnalysisSummaries().then((res) => {
      if (res.data) {
        setAnalysisBriefs(res.data);
        setPolling(false);
        for (const brief of res.data) {
          if (brief.status === "PENDING" || brief.status === "IN_PROGRESS") {
            setPolling(true);
            break;
          }
        }
      } else {
        console.log("Error fetching analysis briefs:", res.errors);
      }
    });
  };

  useEffect(() => {
    setInitLoading(true);
    ProjectService.getFirstScrumBoardUrl().then((res) => {
      if (res.data) {
        setDefaultBoardUrl(res.data);
      } else {
        console.log("Error fetching project ID:", res.errors);
      }
    });
    DefectService.getAllDefectAnalysisSummaries().then((res) => {
      if (res.data) {
        setAnalysisBriefs(res.data);
        setPolling(false);
        for (const brief of res.data) {
          if (brief.status === "PENDING" || brief.status === "IN_PROGRESS") {
            setPolling(true);
            break;
          }
        }
      } else {
        console.log("Error fetching analysis briefs:", res.errors);
      }
      setInitLoading(false);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (polling) {
        fetchBriefs();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [polling]);

  const triggerAnalysis = async () => {
    await DefectService.analyzeDefects();
    fetchBriefs();
  };

  const selectAnalysis = (id: string) => {
    setLoadingId(id);
    setSelectedId(id);
    console.log("Selected analysis ID:", id);
    DefectService.getDefectAnalysisDetails(id).then((res) => {
      setAnalysisDetails(res.data);

      setLoadingId(undefined);
    });
    console.log("Loaded analysis details for ID:", id);
  };

  const onSolvedChange = (defectId: string, solved: boolean) => {
    if (analysisDetails) {
      // Move the defect to the end of the list
      const updatedDefects = analysisDetails.defects
        .map((defect) =>
          defect.id === defectId ? { ...defect, solved: solved } : defect
        )
        .sort((a, b) => Number(a.solved) - Number(b.solved));
      setAnalysisDetails({
        ...analysisDetails,
        defects: updatedDefects,
      });
    }
    DefectService.changeDefectSolved(defectId, solved).then((res) => {
      if (res.data !== null) {
        console.log("Defect solved status updated successfully", res.data);
      } else {
        console.log("Error updating defect solved status:", res.errors);
      }
    });
  };

  const getIssueLink = (id: string) => {
    if (defaultBoardUrl) {
      return `${defaultBoardUrl}?selectedIssue=${id}`;
    }
    return "#";
  };

  const leftPanel = (width: string) => (
    <Box
      xcss={{
        width: width,
        height: "680px",
      }}
    >
      <Box
        xcss={{
          overflow: "auto",
          height: "600px",
          paddingRight: "space.200",
          paddingBottom: "space.400",
        }}
      >
        <Box xcss={{ marginBottom: "space.200" }}>
          <Button onClick={() => triggerAnalysis()} appearance="primary">
            Start New Analysis
          </Button>
        </Box>
        <HistorySidebar
          history={analysisBriefs}
          onClick={selectAnalysis}
          selectedId={selectedId}
          loadingId={loadingId}
        />
      </Box>
    </Box>
  );

  const rightPanel = (width: string) => (
    <Box
      xcss={{
        width: width,
        height: "680px",
        padding: "space.200",
        overflow: "auto",
        backgroundColor: "elevation.surface.raised",
        boxShadow: "elevation.shadow.raised",
        borderRadius: "border.radius",
      }}
    >
      <DefectSidebar
        defects={analysisDetails ? analysisDetails.defects : []}
        onSolvedChange={onSolvedChange}
        getIssueLink={getIssueLink}
      />
    </Box>
  );

  return (
    <Box
      xcss={{
        width: "100%",
        height: "700px",
        padding: "space.100",
        overflow: "hidden",
        marginTop: "space.100",
      }}
    >
      {initLoading && <ProgressBar value={0} isIndeterminate />}

      <Inline space="space.200" alignBlock="stretch" alignInline="stretch">
        {leftPanel("400px")}
        {rightPanel("100%")}
      </Inline>
    </Box>
  );
};

const App = () => {
  return (
    <Tabs id="default">
      <TabList>
        <Tab>Analyzer</Tab>
        <Tab>Discovery Coach</Tab>
      </TabList>
      <TabPanel>
        <AnalyzerPanel />
      </TabPanel>
      <TabPanel>
        <ChatPanel />
      </TabPanel>
    </Tabs>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
