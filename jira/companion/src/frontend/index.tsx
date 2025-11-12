import React, { useEffect, useState } from "react";
import ForgeReconciler, {
  Box,
  Button,
  ButtonGroup,
  Inline,
  ProgressBar,
  Text,
  Icon,
} from "@forge/react";
import HistorySidebar from "./components/HistorySidebar";
import { AnalysisBrief, AnalysisDetailDto } from "./types/defect";
import DefectService from "./services/defectService";
import ProjectService from "./services/projectService";
import ReportPanel from "./components/ReportPanel";
import DefectSidebar from "./components/DefectSidebar";

const App = () => {
  const [analysisBriefs, setAnalysisBriefs] = useState<AnalysisBrief[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [loadingId, setLoadingId] = useState<string | undefined>(undefined);
  const [analysisDetails, setAnalysisDetails] =
    useState<AnalysisDetailDto | null>(null);
  const [polling, setPolling] = useState<boolean>(false);

  const [initLoading, setInitLoading] = useState<boolean>(true);

  const [layoutStyle, setLayoutStyle] = useState<
    "style1" | "style2" | "style3"
  >("style1");

  const [defaultBoardUrl, setDefaultBoardUrl] = useState<string | null>(null);

  const fetchBriefs = () => {
    DefectService.getAllDefectAnalysisBriefs().then((res) => {
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
    DefectService.getAllDefectAnalysisBriefs().then((res) => {
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
      if (res.data) {
        setAnalysisDetails(res.data);
      }
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

  const centerPanel = (width: string) => (
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
      <ReportPanel report={analysisDetails ? analysisDetails.summary : ""} />
    </Box>
  );

  const rightPanel = (width: string) => (
    <Box
      xcss={{
        overflow: "auto",
        width: width,
        height: "680px",
        paddingRight: "space.200",
        paddingBottom: "space.400",
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
      }}
    >
      <ButtonGroup>
        <Button
          spacing="none"
          appearance="subtle"
          onClick={() => setLayoutStyle("style2")}
        >
          <Icon glyph="align-image-left" label="Left Style" />
        </Button>
        <Button
          spacing="none"
          appearance="subtle"
          onClick={() => setLayoutStyle("style1")}
        >
          <Icon glyph="align-image-center" label="Center Style" />
        </Button>
        <Button
          spacing="none"
          appearance="subtle"
          onClick={() => setLayoutStyle("style3")}
        >
          <Icon glyph="align-image-right" label="Right Style" />
        </Button>
      </ButtonGroup>

      {initLoading && <ProgressBar value={0} isIndeterminate />}

      {layoutStyle === "style1" && (
        <Inline space="space.200" alignBlock="stretch" alignInline="stretch">
          {leftPanel("500px")}
          {centerPanel("800px")}
          {rightPanel("100%")}
        </Inline>
      )}
      {layoutStyle === "style2" && (
        <Inline space="space.200" alignBlock="stretch" alignInline="stretch">
          {leftPanel("400px")}
          {rightPanel("100%")}
        </Inline>
      )}
      {layoutStyle === "style3" && (
        <Inline space="space.200" alignBlock="stretch" alignInline="stretch">
          {centerPanel("1000px")}
          {rightPanel("100%")}
        </Inline>
      )}
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
