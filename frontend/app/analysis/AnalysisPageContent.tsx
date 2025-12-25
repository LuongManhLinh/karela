"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, Typography, Divider } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

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
import { downloadAsJson } from "@/utils/export_utils";
import { useUserConnectionsQuery, useProjectKeysQuery, useIssueKeysQuery } from "@/hooks/queries/useUserQueries";
import { useAnalysisSummariesQuery, useAnalysisDetailsQuery, useAnalysisStatusesQuery, useRunAnalysisMutation, useRerunAnalysisMutation, useMarkDefectSolvedMutation, useGenerateProposalsMutation } from "@/hooks/queries/useAnalysisQueries";
import { useSessionProposalsQuery, useActOnProposalMutation, useActOnProposalContentMutation } from "@/hooks/queries/useProposalQueries";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

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
  // Global State
  const { 
    selectedConnectionId, setSelectedConnectionId,
    selectedProjectKey, setSelectedProjectKey,
    selectedStoryKey, setSelectedStoryKey 
  } = useWorkspaceStore();

  // Connections & Projects Hooks
  const { data: connectionsData, isLoading: isConnectionsLoading } = useUserConnectionsQuery();
  const connections = connectionsData?.data?.jira_connections || [];
  const selectedConnection = connections.find(c => c.id === selectedConnectionId) || null;
  
  const { data: projectKeysData, isLoading: isProjectKeysLoading } = useProjectKeysQuery(selectedConnectionId || undefined);
  const projectKeys = projectKeysData?.data || [];
  const projectKey = selectedProjectKey || "";
  
  const { data: storyKeysData, isLoading: isStoryKeysLoading } = useIssueKeysQuery(selectedConnectionId || undefined, projectKey);
  const storyKeys = storyKeysData?.data ? ["None", ...storyKeysData.data] : [];
  const storyKey = selectedStoryKey || "None";

  // Analysis Hooks
  const { data: summariesData, isLoading: isSummariesLoading } = useAnalysisSummariesQuery(selectedConnectionId || undefined);
  const summaries = summariesData?.data || [];
  
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const { data: analysisDetailData, isLoading: isDetailsLoading } = useAnalysisDetailsQuery(selectedAnalysisId);
  const selectedAnalysisDetail = analysisDetailData?.data || null;

  // Polling
  const [pollingIds, setPollingIds] = useState<string[]>([]);
  // We use the query hook for polling, but logic to update pollingIds needs to be handled.
  // Actually, if we use the hook `useAnalysisStatusesQuery`, it returns data. We need to update our summaries or simply rely on re-fetching summaries?
  // Re-fetching summaries is easier if we just invalidate `summaries` query when status changes.
  // But `getStatus` is lightweight.
  // Let's keep pollingIds state to control which to poll.
  const { data: statusesData } = useAnalysisStatusesQuery(pollingIds);
  
  // Proposals
  const { data: proposalsData, isLoading: isProposalsLoading } = useSessionProposalsQuery(selectedAnalysisId || undefined, "ANALYSIS");
  const analysisProposals = proposalsData?.data || [];

  // Mutations
  const { mutateAsync: runAnalysis, isPending: isRunning } = useRunAnalysisMutation();
  const { mutateAsync: rerunAnalysis, isPending: isRerunning } = useRerunAnalysisMutation();
  const { mutateAsync: markSolved } = useMarkDefectSolvedMutation();
  const { mutateAsync: generateProposals, isPending: isGenerating } = useGenerateProposalsMutation();
  const { mutateAsync: actOnProposal } = useActOnProposalMutation();
  const { mutateAsync: actOnProposalContent } = useActOnProposalContentMutation();
  
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const queryClient = useQueryClient();

  // Initialize connection
  useEffect(() => {
    if (connections.length > 0) {
        if (!selectedConnectionId || !connections.find(c => c.id === selectedConnectionId)) {
            setSelectedConnectionId(connections[0].id);
        }
    }
  }, [connections, selectedConnectionId, setSelectedConnectionId]);
  
  // Initialize project key
  useEffect(() => {
    if (projectKeys.length > 0) {
        if (!selectedProjectKey || !projectKeys.includes(selectedProjectKey)) {
             setSelectedProjectKey(projectKeys[0]);
        }
    } else if (projectKeys.length === 0 && selectedProjectKey) {
        setSelectedProjectKey(null);
    }
  }, [projectKeys, selectedProjectKey, setSelectedProjectKey]);
  
  // Handle polling updates
  useEffect(() => {
    if (statusesData?.data) {
        const updatedStatuses = statusesData.data;
        const stillPollingIds: string[] = [];
        let needInvalidate = false;
        
        Object.entries(updatedStatuses).forEach(([id, status]) => {
             if (status === "IN_PROGRESS" || status === "PENDING") {
                  stillPollingIds.push(id);
             } else {
                  // Status changed to DONE or FAILED
                  needInvalidate = true;
             }
        });
        
        setPollingIds(stillPollingIds);
        if (needInvalidate) {
             queryClient.invalidateQueries({ queryKey: ["analysis", "summaries"] });
             if (selectedAnalysisId && updatedStatuses[selectedAnalysisId] === "DONE") {
                 queryClient.invalidateQueries({ queryKey: ["analysis", "details", selectedAnalysisId] });
             }
        }
    }
  }, [statusesData, queryClient, selectedAnalysisId]);
  
  // Listen for initial summaries to start polling if any are running
  useEffect(() => {
      if (summaries.length > 0) {
          const runningIds = summaries
            .filter(s => s.status === "IN_PROGRESS" || s.status === "PENDING")
            .map(s => s.id);
          if (runningIds.length > 0) {
              setPollingIds(prev => Array.from(new Set([...prev, ...runningIds])));
          }
      }
  }, [summaries]);



  const handleSelectAnalysis = async (analysisId: string) => {
    setSelectedAnalysisId(analysisId);
  };

  const handleConnectionChange = async (conn: JiraConnectionDto) => {
    setSelectedConnectionId(conn.id);
    setSelectedAnalysisId(null);
  };

  const handleProjectKeyChange = (projKey: string) => {
    setSelectedProjectKey(projKey);
  };

  const handleRunAnalysis = async () => {
    if (!selectedConnectionId) return;
    setError("");

    try {
      const analysisType = storyKey !== "None" ? "TARGETED" : "ALL";
      const targetStoryKey = storyKey !== "None" ? storyKey : undefined;
      await runAnalysis({
        connectionId: selectedConnectionId,
        projectKey,
        data: {
          analysis_type: analysisType,
          target_story_key: targetStoryKey,
        }
      });
      // Summaries should update via invalidation
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to start analysis";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const handleMarkSolved = async (defectId: string, solved: boolean) => {
    try {
      await markSolved({ defectId, solved });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to update defect status";
      setError(errorMessage);
      setShowError(true);
    }
  };



  const handleGenerateProposals = async () => {
    if (!selectedAnalysisId) return;
    try {
      await generateProposals(selectedAnalysisId);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to start proposal generation";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const handleProposalAction = async (
    proposalId: string,
    flag: ProposalActionFlag
  ) => {
    if (!selectedAnalysisId) return;
    try {
      await actOnProposal({ proposalId, flag });
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
      await actOnProposalContent({ proposalId, contentId: content.id, flag });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to update proposal content";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const handleRerunAnalysis = async () => {
    if (!selectedConnectionId || !selectedAnalysisId) return;
    setError("");

    try {
      await rerunAnalysis(selectedAnalysisId);
      // Invalidation handles state update
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

  const handleExportDefects = () => {
    if (!selectedAnalysisDetail || selectedAnalysisDetail.defects.length === 0)
      return;
    const filename = `defects_${selectedAnalysisDetail.key}_${
      new Date().toISOString().split("T")[0]
    }`;
    downloadAsJson(selectedAnalysisDetail.defects, filename);
  };

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
            {isDetailsLoading ? (
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
                  <Stack direction="row" spacing={2}>
                    {selectedAnalysisDetail.defects.length > 0 && (
                      <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={handleExportDefects}
                      >
                        Export to JSON
                      </Button>
                    )}
                    {rerunButton()}
                  </Stack>
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
                      isGenerating ||
                      selectedAnalysisDetail.status === "IN_PROGRESS"
                    }
                  >
                    {isGenerating
                      ? "Generating..."
                      : "Generate from defects"}
                  </Button>
                </Stack>
                {isProposalsLoading ? (
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
        onChange: (k) => setSelectedStoryKey(k === "None" ? null : k),
        selectedOption: storyKey,
      }}
      submitAction={{
        label: "Run Analysis",
        onClick: handleRunAnalysis,
      }}
      sessions={sessionItems}
      selectedSessionId={selectedAnalysisId}
      onSelectSession={handleSelectAnalysis}
      loadingSessions={isSummariesLoading}
      loadingConnections={isConnectionsLoading}
      loadingProjectKeys={isProjectKeysLoading}
      loadingStoryKeys={isStoryKeysLoading}
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
