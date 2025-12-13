"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, Typography, Divider } from "@mui/material";

import { WorkspaceShell } from "@/components/WorkspaceShell";
import { SessionItem } from "@/components/SessionList";
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
import StoryChip from "@/components/StoryChip";
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
  const [loadingProjectKeys, setLoadingProjectKeys] = useState(false);
  const [loadingStoryKeys, setLoadingStoryKeys] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [generatingProposals, setGeneratingProposals] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  // Polling to check status of running analyses
  const [pollingIds, setPollingIds] = useState<string[]>([]);

  useEffect(() => {
    void loadConnections();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pollingIds.length > 0) {
        console.log("Polling analysis statuses for IDs:", pollingIds);
        analysisService.getAnalysisStatuses(pollingIds).then((response) => {
          const updatedStatuses = response.data || {};
          console.log("Updated statuses:", updatedStatuses);
          const stillPollingIds: string[] = [];
          let needRefresh = false;

          const updatedSummaries = summaries.map((summary) => {
            const newStatus = updatedStatuses[summary.id];

            if (newStatus) {
              if (newStatus === "IN_PROGRESS" || newStatus === "PENDING") {
                stillPollingIds.push(summary.id);
              } else if (
                newStatus === "DONE" &&
                summary.id === selectedAnalysisId
              ) {
                // If the analysis just completed and is selected, reload its details
                void handleSelectAnalysis(summary.id);
              }
              if (summary.status !== newStatus) {
                needRefresh = true;
                return { ...summary, status: newStatus } as AnalysisSummary;
              }
            }
            return summary;
          });

          if (needRefresh) {
            setSummaries(updatedSummaries);
          }
          setPollingIds(stillPollingIds);

          console.log("Still polling IDs:", stillPollingIds);
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pollingIds]);

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
      setLoadingProjectKeys(true);
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
    } finally {
      setLoadingProjectKeys(false);
    }
  };

  const loadStoryKeys = async (connId: string, projKey: string) => {
    try {
      setLoadingStoryKeys(true);
      const response = await userService.getIssueKeys(connId, projKey);
      if (response.data) {
        setStoryKeys(["None", ...response.data]);
        setStoryKey("None");
      }
    } catch (err) {
      console.error("Failed to load story keys:", err);
    } finally {
      setLoadingStoryKeys(false);
    }
  };

  const loadSummaries = async (connId: string) => {
    setLoadingSessions(true);
    try {
      const response = await analysisService.getAnalysisSummaries(connId);
      if (response.data) {
        setSummaries(response.data);
        if (response.data.length > 0) {
          // Set polling if there are running analyses
          const runningIds = response.data
            .filter(
              (summary) =>
                summary.status === "IN_PROGRESS" || summary.status === "PENDING"
            )
            .map((summary) => summary.id);
          setPollingIds(runningIds);
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
      setSelectedAnalysisDetail(response.data || null);

      if (response.data) {
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
    setError("");

    try {
      const analysisType = storyKey !== "None" ? "TARGETED" : "ALL";
      const targetStoryKey = storyKey !== "None" ? storyKey : undefined;
      const result = await analysisService.runAnalysis(
        selectedConnection!.id,
        projectKey,
        {
          analysis_type: analysisType,
          target_story_key: targetStoryKey,
        }
      );
      const { id, key } = result.data!;
      setSummaries((prev) => {
        return [
          {
            id,
            key,
            status: "PENDING",
            type: analysisType,
            project_key: projectKey,
            story_key: targetStoryKey,
            created_at: new Date().toISOString(),
          } as AnalysisSummary,
          ...prev,
        ];
      });
      setPollingIds((prev) => [...prev, id]);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to start analysis";
      setError(errorMessage);
      setShowError(true);
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

  const handleRerunAnalysis = async () => {
    if (!selectedConnection || !selectedAnalysisId) return;
    setError("");

    try {
      await analysisService.rerunAnalysis(selectedAnalysisId);
      setSummaries((prev) => {
        return prev.map((summary) => {
          if (summary.id === selectedAnalysisId) {
            return { ...summary, status: "IN_PROGRESS" };
          }
          return summary;
        });
      });
      setPollingIds((prev) => [...prev, selectedAnalysisId]);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to rerun analysis";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const sessionItems = useMemo<SessionItem[]>(() => {
    return summaries.map((summary) => ({
      id: summary.id,
      title: summary.key,
      subtitle: summary.created_at
        ? new Date(summary.created_at).toLocaleString()
        : undefined,
      chips: [
        summary.type ? { label: summary.type, color: "default" } : undefined,
        summary.status
          ? { label: summary.status, color: getStatusColor(summary.status) }
          : undefined,
      ].filter(Boolean) as Array<{ label: string; color?: any }>,
      running: summary.status === "IN_PROGRESS" || summary.status === "PENDING",
    }));
  }, [summaries]);

  const rerunButton = () => {
    const running =
      selectedAnalysisId !== null && pollingIds.includes(selectedAnalysisId);
    return (
      <Button
        variant="contained"
        onClick={handleRerunAnalysis}
        disabled={running}
      >
        {running ? "Analysis Running..." : "Rerun Analysis"}
      </Button>
    );
  };

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
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6">Defects</Typography>
                  {rerunButton()}
                </Stack>
                {selectedAnalysisDetail.defects.length === 0 ? (
                  <Typography color="text.secondary">
                    No defects found in this analysis.
                  </Typography>
                ) : (
                  selectedAnalysisDetail.defects.map((defect) => (
                    <DefectCard
                      key={defect.id}
                      defect={defect}
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
              <Box sx={{ height: 100 }} />
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
      selectedConnection={selectedConnection}
      onConnectionChange={handleConnectionChange}
      projectOptions={{
        options: projectKeys,
        onChange: handleProjectKeyChange,
        selectedOption: projectKey,
      }}
      storyOptions={{
        options: storyKeys,
        onChange: setStoryKey,
        selectedOption: storyKey,
      }}
      submitAction={{
        label: "Run Analysis",
        onClick: handleRunAnalysis,
      }}
      sessions={sessionItems}
      selectedSessionId={selectedAnalysisId}
      onSelectSession={handleSelectAnalysis}
      loadingSessions={loadingSessions}
      loadingConnections={loadingConnections}
      loadingProjectKeys={loadingProjectKeys}
      loadingStoryKeys={loadingStoryKeys}
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
