import React, { useEffect, useState } from "react";
import ForgeReconciler, {
  Box,
  Button,
  ButtonGroup,
  Inline,
  Text,
} from "@forge/react";
import HistorySidebar from "./components/HistorySidebar";
import ActionPanel from "./components/ActionPanel";
import { AnalysisBrief, AnalysisDetailDto } from "./types/defect";
import DefectService from "./services/defectService";
import ReportPanel from "./components/ReportPanel";
import DefectSidebar from "./components/DefectSidebar";

const App = () => {
  const [analysisBriefs, setAnalysisBriefs] = useState<AnalysisBrief[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [analysisDetails, setAnalysisDetails] =
    useState<AnalysisDetailDto | null>(null);
  const [polling, setPolling] = useState<boolean>(false);

  const [layoutStyle, setLayoutStyle] = useState<
    "style1" | "style2" | "style3"
  >("style1");

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
        console.log("Error fetching analysis briefs:", res.error);
      }
    });
  };

  useEffect(() => {
    fetchBriefs();
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
    setSelectedId(id);
    DefectService.getDefectAnalysisDetails(id).then((res) => {
      if (res.data) {
        setAnalysisDetails(res.data);
      }
    });
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
          padding: "space.050",
          backgroundColor: "elevation.surface.raised",
          boxShadow: "elevation.shadow.raised",
          borderRadius: "border.radius",
        }}
      >
        <ActionPanel
          idleMessage={"RatSnake is idle."}
          isRunning={false}
          runMessage={"Analyzing…"}
          notification={""}
        />
      </Box>

      <Box
        xcss={{
          overflow: "auto",
          height: "600px",
          marginTop: "space.200",
          paddingRight: "space.200",
          paddingBottom: "space.400",
        }}
      >
        <HistorySidebar
          history={analysisBriefs}
          onClick={selectAnalysis}
          selectedId={selectedId}
        />
      </Box>
    </Box>
  );

  const centerPanel = (width: string) => (
    <Box
      xcss={{
        width: width,
        height: "680px",
        padding: "space.600",
        overflow: "auto",
        backgroundColor: "elevation.surface.raised",
        boxShadow: "elevation.shadow.raised",
        borderRadius: "border.radius",
      }}
    >
      <Box>
        <Text size="large" weight="bold">
          Summary
        </Text>
        <ReportPanel report={analysisDetails ? analysisDetails.summary : ""} />
      </Box>
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
      <Text size="large" weight="bold">
        Defects
      </Text>
      <DefectSidebar defects={analysisDetails ? analysisDetails.defects : []} />
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
        <Button onClick={() => triggerAnalysis()} appearance="primary">
          Start Analysis
        </Button>
        <Button
          spacing="none"
          appearance="primary"
          onClick={() => setLayoutStyle("style1")}
        >
          {" "}
          Left Style{" "}
        </Button>
        <Button
          spacing="none"
          appearance="primary"
          onClick={() => setLayoutStyle("style2")}
        >
          {" "}
          Center Style{" "}
        </Button>
        <Button
          spacing="none"
          appearance="primary"
          onClick={() => setLayoutStyle("style3")}
        >
          {" "}
          Right Style{" "}
        </Button>
      </ButtonGroup>

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
