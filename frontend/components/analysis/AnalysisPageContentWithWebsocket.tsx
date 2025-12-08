"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { Box, Button, Stack, Typography, Divider } from "@mui/material";

import {
  WorkspaceShell,
  WorkspaceSessionItem,
} from "@/components/WorkspaceShell";
import { analysisService } from "@/services/analysisService";
import { proposalService } from "@/services/proposalService";
import { userService } from "@/services/userService";
import { ErrorSnackbar } from "@/components/ErrorSnackbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ProposalCard } from "@/components/proposals/ProposalCard";
import type { AnalysisDto, AnalysisSummary } from "@/types/analysis";
import type {
  ProposalDto,
  ProposalContentDto,
  ProposalActionFlag,
} from "@/types/proposal";
import type { JiraConnectionDto } from "@/types/integration";
import DefectCard from "@/components/analysis/DefectCard";

const getStatusColor = (status?: string) => {
  switch (status) {
    case "DONE":
      return "success";
    case "IN_PROGRESS":
      return "info";
    case "FAILED":
      return "error";
    case "PENDING":
      return "warning";
    default:
      return "default";
  }
};

const WS_BASE_URL = "ws://localhost:8000/api/v1/analyses/";

const AnalysisPageContent: React.FC = () => {
  const [connections, setConnections] = useState<JiraConnectionDto[]>([]);
  const [selectedConnection, setSelectedConnection] =
    useState<JiraConnectionDto | null>(null);
  const [projectKeys, setProjectKeys] = useState<string[]>([]);
  const [projectKey, setProjectKey] = useState("");
  const [storyKeys, setStoryKeys] = useState<string[]>([]);
  const [storyKey, setStoryKey] = useState("");
  const [summaries, setSummaries] = useState<AnalysisSummary[]>([]);
  const [selectedAnalysisDetail, setSelectedAnalysisDetail] =
    useState<AnalysisDto | null>(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(
    null
  );
  const [analysisProposals, setAnalysisProposals] = useState<ProposalDto[]>([]);

  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [generatingProposals, setGeneratingProposals] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  // WebSocket state
  const [connecting, setConnecting] = useState(false);
  const [streamingAnalysisId, setStreamingAnalysisId] = useState<string | null>(
    null
  );
  const [streamingStatus, setStreamingStatus] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    void loadConnections();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      void loadSummaries(selectedConnection.id);
    }
  }, [selectedConnection]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const loadConnections = async () => {
    setLoadingConnections(true);
    try {
      const response = await userService.getUserConnections();
      if (response.data) {
        const jiraConnections = response.data.jira_connections || [];
        setConnections(jiraConnections);
        if (jiraConnections.length > 0) {
          const firstConnection = jiraConnections[0];
          setSelectedConnection(firstConnection);
          await loadProjectKeys(firstConnection.id);
        }
      }
    } catch (err) {
      console.error("Failed to load connections:", err);
    } finally {
      setLoadingConnections(false);
    }
  };

  const loadProjectKeys = async (connId: string) => {
    try {
      const response = await userService.getProjectKeys(connId);
      if (response.data) {
        setProjectKeys(response.data);
        if (response.data.length > 0) {
          const firstProject = response.data[0];
          setProjectKey(firstProject);
          await loadStoryKeys(connId, firstProject);
        } else {
          setProjectKey("");
          setStoryKeys([]);
        }
      }
    } catch (err) {
      console.error("Failed to load project keys:", err);
    }
  };

  const loadStoryKeys = async (connId: string, projKey: string) => {
    try {
      const response = await userService.getIssueKeys(connId, projKey);
      if (response.data) {
        setStoryKeys(["None", ...response.data]);
        setStoryKey("None");
      }
    } catch (err) {
      console.error("Failed to load story keys:", err);
    }
  };

  const loadSummaries = async (connId: string) => {
    setLoadingSessions(true);
    try {
      const response = await analysisService.getAnalysisSummaries(connId);
      if (response.data) {
        setSummaries(response.data);
        if (response.data.length > 0) {
          void handleSelectAnalysis(response.data[0].id);
        } else {
          setSelectedAnalysisDetail(null);
          setSelectedAnalysisId(null);
          setAnalysisProposals([]);
        }
      }
    } catch (err) {
      console.error("Failed to load summaries:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSelectAnalysis = async (analysisId: string) => {
    setSelectedAnalysisId(analysisId);
    setLoadingDetails(true);
    setAnalysisProposals([]);
    try {
      const response = await analysisService.getAnalysisDetails(analysisId);
      if (response.data) {
        setSelectedAnalysisDetail(response.data);
        await fetchAnalysisProposals(analysisId);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to load analysis details";
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleConnectionChange = async (conn: JiraConnectionDto) => {
    setSelectedConnection(conn);
    setSummaries([]);
    setSelectedAnalysisDetail(null);
    setSelectedAnalysisId(null);
    setAnalysisProposals([]);
    await loadProjectKeys(conn.id);
  };

  const handleProjectKeyChange = async (projKey: string) => {
    setProjectKey(projKey);
    setStoryKey("");
    await loadStoryKeys(selectedConnection!.id, projKey);
  };

  const connectWebSocket = useCallback(
    (
      connId: string,
      projKey: string,
      analysisType: "ALL" | "TARGETED",
      targetStoryKey?: string
    ) => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        setShowError(true);
        return;
      }

      // Close existing WebSocket if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      setConnecting(true);
      setError("");
      setStreamingAnalysisId(null);
      setStreamingStatus("PENDING");
      setStreamingMessage("Initializing analysis...");

      try {
        const ws = new WebSocket(WS_BASE_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
          // Send initialization message
          const initMessage: any = {
            token,
            connection_id: connId,
            project_key: projKey,
            analysis_type: analysisType,
            target_story_key: targetStoryKey || null,
          };

          ws.send(JSON.stringify(initMessage));
        };

        ws.onmessage = (event) => {
          try {
            const chunk = JSON.parse(event.data);
            console.log("Received chunk:", chunk);

            // Handle analysis ID (sent first)
            if (chunk.id && !streamingAnalysisId) {
              console.log("Setting streaming analysis ID:", chunk.id);
              setStreamingAnalysisId(chunk.id);
              setSelectedAnalysisId(chunk.id);

              // Add new analysis to summaries list
              setSummaries((prev) => {
                const exists = prev.some((s) => s.id === chunk.id);
                if (exists) return prev;

                const newSummary: AnalysisSummary = {
                  id: chunk.id,
                  project_key: projKey,
                  story_key: targetStoryKey,
                  type: analysisType,
                  status: chunk.status || "PENDING",
                  created_at: new Date().toISOString(),
                };
                return [newSummary, ...prev];
              });
            }

            // Handle status update
            if (chunk.status) {
              console.log("Updating status:", chunk.status);
              setStreamingStatus(chunk.status);

              // Update status in summaries
              const analysisId = chunk.id || streamingAnalysisId;
              if (analysisId) {
                setSummaries((prev) =>
                  prev.map((s) =>
                    s.id === analysisId ? { ...s, status: chunk.status } : s
                  )
                );
              }
            }

            // Handle message update
            if (chunk.message) {
              console.log("Updating message:", chunk.message);
              setStreamingMessage(chunk.message);
            }
          } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setError("WebSocket connection error");
          setShowError(true);
          setConnecting(false);
        };

        ws.onclose = () => {
          console.log("WebSocket closed");
          setConnecting(false);
          wsRef.current = null;

          // Fetch final analysis details if we have an ID
          if (streamingAnalysisId) {
            console.log(
              "Fetching final analysis details:",
              streamingAnalysisId
            );
            void handleSelectAnalysis(streamingAnalysisId);
            void loadSummaries(connId);
          }

          // Clear streaming state
          setStreamingAnalysisId(null);
          setStreamingStatus(null);
          setStreamingMessage("");
        };
      } catch (err) {
        console.error("Error connecting to analysis WebSocket:", err);
        setError(
          (err as Error).message || "Failed to connect to analysis server"
        );
        setShowError(true);
        setConnecting(false);
      }
    },
    [streamingAnalysisId, handleSelectAnalysis, loadSummaries]
  );

  const handleRunAnalysis = async () => {
    if (!selectedConnection) return;
    setRunningAnalysis(true);
    setError("");

    const analysisType = storyKey !== "None" ? "TARGETED" : "ALL";
    const targetStoryKey = storyKey !== "None" ? storyKey : undefined;

    // Use WebSocket instead of REST API
    connectWebSocket(
      selectedConnection.id,
      projectKey,
      analysisType,
      targetStoryKey
    );

    setRunningAnalysis(false);
  };

  const handleMarkSolved = async (defectId: string, solved: boolean) => {
    try {
      await analysisService.markDefectAsSolved(defectId, solved ? 1 : 0);
      if (selectedAnalysisId) {
        await handleSelectAnalysis(selectedAnalysisId);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to update defect status";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const fetchAnalysisProposals = async (analysisId: string | null) => {
    if (!analysisId) {
      setAnalysisProposals([]);
      return;
    }
    setLoadingProposals(true);
    try {
      const response = await proposalService.getProposalsBySession(
        analysisId,
        "ANALYSIS"
      );
      setAnalysisProposals(response.data || []);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to load proposals";
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleGenerateProposals = async () => {
    if (!selectedAnalysisId) return;
    setGeneratingProposals(true);
    try {
      await analysisService.generateProposalsFromAnalysis(selectedAnalysisId);
      await fetchAnalysisProposals(selectedAnalysisId);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to start proposal generation";
      setError(errorMessage);
      setShowError(true);
    } finally {
      setGeneratingProposals(false);
    }
  };

  const handleProposalAction = async (
    proposalId: string,
    flag: ProposalActionFlag
  ) => {
    if (!selectedAnalysisId) return;
    try {
      await proposalService.actOnProposal(proposalId, flag);
      await fetchAnalysisProposals(selectedAnalysisId);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to update proposal";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const handleProposalContentAction = async (
    proposalId: string,
    content: ProposalContentDto,
    flag: ProposalActionFlag
  ) => {
    if (!selectedAnalysisId || !content.id) return;
    try {
      await proposalService.actOnProposalContent(proposalId, content.id, flag);
      await fetchAnalysisProposals(selectedAnalysisId);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to update proposal content";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const sessionItems = useMemo<WorkspaceSessionItem[]>(() => {
    return summaries.map((summary) => {
      // If this is the currently streaming analysis, use streaming status
      const isStreaming = summary.id === streamingAnalysisId;
      const displayStatus = isStreaming
        ? streamingStatus || summary.status
        : summary.status;

      return {
        id: summary.id,
        title: summary.story_key
          ? `${summary.project_key || "Project"} · ${summary.story_key}`
          : summary.project_key || summary.type || summary.id,
        subtitle: summary.created_at
          ? new Date(summary.created_at).toLocaleString()
          : undefined,
        chips: [
          summary.type ? { label: summary.type, color: "default" } : undefined,
          displayStatus
            ? { label: displayStatus, color: getStatusColor(displayStatus) }
            : undefined,
        ].filter(Boolean) as Array<{ label: string; color?: any }>,
        running:
          displayStatus === "IN_PROGRESS" ||
          displayStatus === "PENDING" ||
          isStreaming,
      };
    });
  }, [summaries, streamingAnalysisId, streamingStatus]);

  const detailsContent = (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100%",
        position: "relative",
        p: 2,
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          scrollbarColor: "#6b6b6b transparent",
          scrollbarWidth: "auto",
        }}
      >
        <Box sx={{ width: "70%", py: 2 }}>
          {loadingDetails ? (
            <LoadingSpinner />
          ) : streamingAnalysisId && connecting ? (
            // Show streaming progress
            <Box sx={{ textAlign: "center", py: 4 }}>
              <LoadingSpinner />
              <Typography variant="h6" sx={{ mt: 2 }}>
                {streamingStatus || "Running Analysis..."}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {streamingMessage}
              </Typography>
            </Box>
          ) : selectedAnalysisDetail ? (
            <Stack spacing={3}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6">Defects</Typography>
                  <Button
                    variant="contained"
                    onClick={handleGenerateProposals}
                    disabled={
                      generatingProposals ||
                      selectedAnalysisDetail.status === "IN_PROGRESS"
                    }
                  >
                    {generatingProposals
                      ? "Generating..."
                      : "Generate from defects"}
                  </Button>
                </Stack>
                {selectedAnalysisDetail.defects.length === 0 ? (
                  <Typography textAlign="center">
                    No defects found in this analysis.
                  </Typography>
                ) : (
                  selectedAnalysisDetail.defects.map((defect) => (
                    <DefectCard
                      defect={defect}
                      key={defect.id}
                      onMarkSolved={handleMarkSolved}
                    />
                  ))
                )}
              </Stack>
              <Divider />
              <Box>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6">Proposals</Typography>
                  <Button
                    variant="contained"
                    onClick={handleGenerateProposals}
                    disabled={
                      generatingProposals ||
                      selectedAnalysisDetail.status === "IN_PROGRESS"
                    }
                  >
                    {generatingProposals
                      ? "Generating..."
                      : "Generate from defects"}
                  </Button>
                </Stack>
                {loadingProposals ? (
                  <LoadingSpinner />
                ) : analysisProposals.length === 0 ? (
                  <Typography color="text.secondary">
                    No proposals generated yet.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {analysisProposals.map((proposal) => (
                      <ProposalCard
                        key={proposal.id}
                        proposal={proposal}
                        onProposalAction={handleProposalAction}
                        onProposalContentAction={handleProposalContentAction}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Typography color="text.secondary" variant="h5">
                Select an analysis to view details.
              </Typography>
            </Box>
          )}
          <Box sx={{ height: 100 }} />
        </Box>
      </Box>
      <ErrorSnackbar
        open={showError}
        message={error}
        onClose={() => setShowError(false)}
      />
    </Box>
  );

  return (
    <WorkspaceShell
      connections={connections}
      selectedConnection={selectedConnection}
      onConnectionChange={handleConnectionChange}
      selectedProjectKey={projectKey}
      projectKeys={projectKeys}
      onProjectKeyChange={handleProjectKeyChange}
      selectedStoryKey={storyKey}
      storyKeys={storyKeys}
      onStoryKeyChange={setStoryKey}
      onSessionFormSubmit={handleRunAnalysis}
      sessionSubmitLabel="Run Analysis"
      sessions={sessionItems}
      selectedSessionId={selectedAnalysisId}
      onSelectSession={handleSelectAnalysis}
      loadingSessions={loadingSessions}
      loadingConnections={loadingConnections}
      emptyStateText="No analyses yet"
      sessionListLabel="Analyses"
      rightChildren={detailsContent}
      headerText="Analysis"
      headerProjectKey={selectedAnalysisDetail?.project_key || ""}
      headerStoryKey={selectedAnalysisDetail?.story_key || ""}
      appBarTransparent
    />
  );
};

export default AnalysisPageContent;
