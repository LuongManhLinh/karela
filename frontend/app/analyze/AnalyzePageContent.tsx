"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  WorkspaceShell,
  WorkspaceSessionItem,
} from "@/components/WorkspaceShell";
import { defectService } from "@/services/defectService";
import { userService } from "@/services/userService";
import { ErrorSnackbar } from "@/components/ErrorSnackbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type {
  AnalysisDetailDto,
  AnalysisSummary,
  JiraConnectionDto,
} from "@/types";

const getStatusColor = (status?: string) => {
  switch (status) {
    case "COMPLETED":
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

const getSeverityColor = (severity?: string) => {
  switch (severity?.toUpperCase()) {
    case "HIGH":
      return "error";
    case "MEDIUM":
      return "warning";
    case "LOW":
      return "info";
    default:
      return "default";
  }
};

const AnalyzePageContent: React.FC = () => {
  const [connections, setConnections] = useState<JiraConnectionDto[]>([]);
  const [connectionId, setConnectionId] = useState("");
  const [projectKeys, setProjectKeys] = useState<string[]>([]);
  const [projectKey, setProjectKey] = useState("");
  const [storyKeys, setStoryKeys] = useState<string[]>([]);
  const [storyKey, setStoryKey] = useState("");
  const [summaries, setSummaries] = useState<AnalysisSummary[]>([]);
  const [selectedAnalysisDetail, setSelectedAnalysisDetail] =
    useState<AnalysisDetailDto | null>(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(
    null
  );

  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    void loadConnections();
  }, []);

  useEffect(() => {
    if (connectionId) {
      void loadSummaries(connectionId);
    }
  }, [connectionId]);

  const loadConnections = async () => {
    setLoadingConnections(true);
    try {
      const response = await userService.getUserConnections();
      if (response.data) {
        const jiraConnections = response.data.jira_connections || [];
        setConnections(jiraConnections);
        if (jiraConnections.length > 0) {
          const firstId = jiraConnections[0].id;
          setConnectionId(firstId);
          await loadProjectKeys(firstId);
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
      }
    } catch (err) {
      console.error("Failed to load story keys:", err);
    }
  };

  const loadSummaries = async (connId: string) => {
    setLoadingSessions(true);
    try {
      const response = await defectService.getAnalysisSummaries(connId);
      if (response.data) {
        setSummaries(response.data);
        if (response.data.length > 0) {
          void handleSelectAnalysis(response.data[0].id);
        } else {
          setSelectedAnalysisDetail(null);
          setSelectedAnalysisId(null);
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
    try {
      const response = await defectService.getAnalysisDetails(analysisId);
      if (response.data) {
        setSelectedAnalysisDetail(response.data);
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

  const handleConnectionChange = async (connId: string) => {
    setConnectionId(connId);
    setSummaries([]);
    setSelectedAnalysisDetail(null);
    setSelectedAnalysisId(null);
    await loadProjectKeys(connId);
  };

  const handleProjectKeyChange = async (projKey: string) => {
    setProjectKey(projKey);
    setStoryKey("");
    await loadStoryKeys(connectionId, projKey);
  };

  const handleRunAnalysis = async () => {
    if (!connectionId) return;
    setRunningAnalysis(true);
    setError("");

    try {
      await defectService.runAnalysis(connectionId, projectKey, {
        analysis_type: storyKey !== "None" ? "TARGETED" : "ALL",
        target_story_key: storyKey || undefined,
      });
      await loadSummaries(connectionId);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to start analysis";
      setError(errorMessage);
      setShowError(true);
    } finally {
      setRunningAnalysis(false);
    }
  };

  const handleMarkSolved = async (defectId: string, solved: boolean) => {
    try {
      await defectService.markDefectAsSolved(defectId, solved ? 1 : 0);
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

  const sessionItems = useMemo<WorkspaceSessionItem[]>(() => {
    return summaries.map((summary) => ({
      id: summary.id,
      title: summary.story_key
        ? `${summary.project_key || "Project"} · ${summary.story_key}`
        : summary.project_key || summary.type || summary.id,
      subtitle: summary.started_at
        ? new Date(summary.started_at).toLocaleString()
        : undefined,
      chips: [
        summary.type ? { label: summary.type, color: "default" } : undefined,
        summary.status
          ? { label: summary.status, color: getStatusColor(summary.status) }
          : undefined,
      ].filter(Boolean) as Array<{ label: string; color?: any }>,
    }));
  }, [summaries]);

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
        }}
      >
        <Box sx={{ width: "70%", py: 2 }}>
          {loadingDetails ? (
            <LoadingSpinner />
          ) : selectedAnalysisDetail ? (
            <Stack spacing={2}>
              {selectedAnalysisDetail.defects.length === 0 ? (
                <Typography textAlign="center">
                  No defects found in this analysis.
                </Typography>
              ) : (
                selectedAnalysisDetail.defects.map((defect) => (
                  <Card
                    key={defect.id}
                    elevation={1}
                    sx={{
                      borderRadius: 3,
                      transition: "all 0.2s",
                      "&:hover": {
                        elevation: 3,
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: { xs: "flex-start", md: "center" },
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {defect.type && (
                            <Chip label={defect.type} size="small" />
                          )}
                          {defect.severity && (
                            <Chip
                              label={`Severity: ${defect.severity}`}
                              size="small"
                              color={getSeverityColor(defect.severity)}
                            />
                          )}
                          {typeof defect.confidence === "number" && (
                            <Chip
                              label={`Confidence: ${(
                                defect.confidence * 100
                              ).toFixed(0)}%`}
                              size="small"
                            />
                          )}
                          {defect.work_item_keys?.length ? (
                            <Chip
                              label={`Work Items: ${defect.work_item_keys.length}`}
                              size="small"
                              color="info"
                            />
                          ) : null}
                        </Stack>
                        <Button
                          size="small"
                          variant={defect.solved ? "outlined" : "contained"}
                          color={defect.solved ? "success" : "primary"}
                          onClick={() =>
                            handleMarkSolved(defect.id, !defect.solved)
                          }
                        >
                          {defect.solved ? "Mark Unsolved" : "Mark Solved"}
                        </Button>
                      </Box>
                      {defect.explanation && (
                        <Typography variant="body2" paragraph>
                          <strong>Explanation:</strong> {defect.explanation}
                        </Typography>
                      )}
                      {defect.suggested_fix && (
                        <Typography variant="body2" paragraph>
                          <strong>Suggested Fix:</strong> {defect.suggested_fix}
                        </Typography>
                      )}
                      {defect.work_item_keys &&
                        defect.work_item_keys.length > 0 && (
                          <Typography variant="body2">
                            <strong>Work Items:</strong>{" "}
                            {defect.work_item_keys.join(", ")}
                          </Typography>
                        )}
                    </CardContent>
                  </Card>
                ))
              )}
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
      selectedConnectionId={connectionId}
      onConnectionChange={handleConnectionChange}
      selectedProjectKey={projectKey}
      projectKeys={projectKeys}
      onProjectKeyChange={handleProjectKeyChange}
      selectedStoryKey={storyKey}
      storyKeys={storyKeys}
      onStoryKeyChange={setStoryKey}
      onSessionFormSubmit={handleRunAnalysis}
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

export default AnalyzePageContent;
