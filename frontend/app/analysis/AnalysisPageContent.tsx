"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
  Divider,
} from "@mui/material";

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
import type { AnalysisDetailDto, AnalysisSummary } from "@/types/analysis";
import type {
  ProposalDto,
  ProposalContentDto,
  ProposalActionFlag,
} from "@/types/proposal";
import type { JiraConnectionDto } from "@/types/integration";

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
    useState<AnalysisDetailDto | null>(null);
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

  useEffect(() => {
    void loadConnections();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      void loadSummaries(selectedConnection.id);
    }
  }, [selectedConnection]);

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

  const handleRunAnalysis = async () => {
    if (!selectedConnection) return;
    setRunningAnalysis(true);
    setError("");

    try {
      await analysisService.runAnalysis(selectedConnection!.id, projectKey, {
        analysis_type: storyKey !== "None" ? "TARGETED" : "ALL",
        target_story_key: storyKey || undefined,
      });
      await loadSummaries(selectedConnection!.id);
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
          scrollbarColor: "#6b6b6b transparent",
          scrollbarWidth: "auto",
        }}
      >
        <Box sx={{ width: "70%", py: 2 }}>
          {loadingDetails ? (
            <LoadingSpinner />
          ) : selectedAnalysisDetail ? (
            <Stack spacing={3}>
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
                        borderRadius: 1,
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
                            <strong>Suggested Fix:</strong>{" "}
                            {defect.suggested_fix}
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
                  <Stack spacing={2}>
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
