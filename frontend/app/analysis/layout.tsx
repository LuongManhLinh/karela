"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import { WorkspaceShell } from "@/components/WorkspaceShell";
import { SessionItem } from "@/components/SessionList";
import type {
  JiraConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/integration";
import {
  useUserConnectionsQuery,
  useProjectKeysQuery,
  useStoryKeysQuery,
} from "@/hooks/queries/useUserQueries";
import {
  useAnalysisSummariesQuery,
  useAnalysisStatusesQuery,
  useRunAnalysisMutation,
} from "@/hooks/queries/useAnalysisQueries";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useRouter } from "next/navigation";
import { NONE_STORY_SUMMARY } from "@/constants/selectable";

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

interface AnalysisPageLayoutProps {
  children?: React.ReactNode;
}

const AnalysisPageLayout: React.FC<AnalysisPageLayoutProps> = ({
  children,
}) => {
  // Global State
  const {
    selectedConnectionId,
    setSelectedConnectionId,
    selectedProjectKey,
    setSelectedProjectKey,
    selectedStoryKey,
    setSelectedStoryKey,
    headerProjectKey,
    setHeaderProjectKey,
    headerStoryKey,
    setHeaderStoryKey,
  } = useWorkspaceStore();

  // Connections & Projects Hooks
  const { data: connectionsData, isLoading: isConnectionsLoading } =
    useUserConnectionsQuery();
  const connections = connectionsData?.data?.jira_connections || [];
  const selectedConnection =
    connections.find((c) => c.id === selectedConnectionId) || null;

  const { data: projectDtosData, isLoading: isProjectDtosLoading } =
    useProjectKeysQuery(selectedConnectionId || undefined);
  const projectDtos = projectDtosData?.data || [];
  const selectedProjectDto =
    projectDtos.find((p) => p.key === selectedProjectKey) || null;

  const { data: storySummariesData, isLoading: isStorySummariesLoading } =
    useStoryKeysQuery(
      selectedConnectionId || undefined,
      selectedProjectDto?.key || undefined
    );
  const storySummaries = storySummariesData?.data
    ? [NONE_STORY_SUMMARY, ...storySummariesData.data]
    : [];
  const selectedStorySummary =
    storySummaries.find((s) => s.key === selectedStoryKey) ||
    NONE_STORY_SUMMARY;

  // Analysis Hooks
  const { data: summariesData, isLoading: isSummariesLoading } =
    useAnalysisSummariesQuery(selectedConnectionId || undefined);
  const summaries = summariesData?.data || [];

  const analysisIdRef = useRef<string | null>(null);

  // Polling
  const [pollingIds, setPollingIds] = useState<string[]>([]);
  // We use the query hook for polling, but logic to update pollingIds needs to be handled.
  // Actually, if we use the hook `useAnalysisStatusesQuery`, it returns data. We need to update our summaries or simply rely on re-fetching summaries?
  // Re-fetching summaries is easier if we just invalidate `summaries` query when status changes.
  // But `getStatus` is lightweight.
  // Let's keep pollingIds state to control which to poll.
  const { data: statusesData } = useAnalysisStatusesQuery(pollingIds);

  // Mutations
  const { mutateAsync: runAnalysis, isPending: isRunning } =
    useRunAnalysisMutation();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Initialize connection
  useEffect(() => {
    if (connections.length > 0) {
      if (
        !selectedConnectionId ||
        !connections.find((c) => c.id === selectedConnectionId)
      ) {
        setSelectedConnectionId(connections[0].id);
      }
    }
  }, [connections, selectedConnectionId, setSelectedConnectionId]);

  // Initialize project key
  useEffect(() => {
    if (projectDtos.length > 0) {
      if (
        !selectedProjectKey ||
        !projectDtos.find((p) => p.key === selectedProjectKey)
      ) {
        setSelectedProjectKey(projectDtos[0].key);
      }
    } else if (projectDtos.length === 0 && selectedProjectKey) {
      setSelectedProjectKey(null);
    }
  }, [projectDtos, selectedProjectKey, setSelectedProjectKey]);

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
      // if (needInvalidate) {
      //   queryClient.invalidateQueries({ queryKey: ["analysis", "summaries"] });
      //   if (
      //     selectedAnalysisId &&
      //     updatedStatuses[selectedAnalysisId] === "DONE"
      //   ) {
      //     queryClient.invalidateQueries({
      //       queryKey: ["analysis", "details", selectedAnalysisId],
      //     });
      //   }
      // }
    }
  }, [statusesData, queryClient]);

  // Listen for initial summaries to start polling if any are running
  useEffect(() => {
    if (summaries.length > 0) {
      const runningIds = summaries
        .filter((s) => s.status === "IN_PROGRESS" || s.status === "PENDING")
        .map((s) => s.id);
      if (runningIds.length > 0) {
        setPollingIds((prev) => Array.from(new Set([...prev, ...runningIds])));
      }
    }
  }, [summaries]);

  const handleSelectAnalysis = async (analysisId: string) => {
    analysisIdRef.current = analysisId;
    router.push(`/analysis/${analysisId}`);
  };

  const handleConnectionChange = async (conn: JiraConnectionDto) => {
    setSelectedConnectionId(conn.id);
    analysisIdRef.current = null;
  };

  const handleProjectChange = (proj: ProjectDto | null) => {
    setSelectedProjectKey(proj ? proj.key : null);
  };

  const handleStoryChange = (story: StorySummary | null) => {
    setSelectedStoryKey(story ? story.key : null);
  };

  const handleRunAnalysis = async () => {
    if (!selectedConnectionId) return;
    try {
      const analysisType =
        selectedStorySummary.key !== "none" ? "TARGETED" : "ALL";
      const targetStoryKey =
        selectedStorySummary.key !== "none"
          ? selectedStorySummary.key
          : undefined;
      if (!selectedProjectDto) {
        throw new Error("No project selected");
      }
      await runAnalysis({
        connectionId: selectedConnectionId,
        projectKey: selectedProjectDto.key,
        data: {
          analysis_type: analysisType,
          target_story_key: targetStoryKey,
        },
      });
      // Summaries should update via invalidation
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to start analysis";
      console.error(errorMessage);
    }
  };

  const sessionItems = useMemo<SessionItem[]>(() => {
    const items: SessionItem[] = [];
    summaries.forEach((summary) => {
      items.push({
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
        running:
          summary.status === "IN_PROGRESS" || summary.status === "PENDING",
      });

      if (summary.id === analysisIdRef.current) {
        setHeaderProjectKey(summary.project_key);
        setHeaderStoryKey(summary.story_key || "");
      }
    });
    return items;
  }, [summaries]);

  return (
    <WorkspaceShell
      connections={connections}
      selectedConnection={selectedConnection}
      onConnectionChange={handleConnectionChange}
      projectOptions={{
        options: projectDtos,
        onChange: handleProjectChange,
        selectedOption: selectedProjectDto,
      }}
      storyOptions={{
        options: storySummaries,
        onChange: handleStoryChange,
        selectedOption: selectedStorySummary,
      }}
      submitAction={{
        label: "Run Analysis",
        onClick: handleRunAnalysis,
      }}
      sessions={sessionItems}
      selectedSessionId={analysisIdRef.current}
      onSelectSession={handleSelectAnalysis}
      loadingSessions={isSummariesLoading}
      loadingConnections={isConnectionsLoading}
      loadingProjectKeys={isProjectDtosLoading}
      loadingStoryKeys={isStorySummariesLoading}
      emptyStateText="No analyses yet"
      sessionListLabel="Analyses"
      rightChildren={children}
      headerText="Analysis"
      headerProjectKey={headerProjectKey || ""}
      headerStoryKey={headerStoryKey || ""}
      appBarTransparent
    />
  );
};

export default AnalysisPageLayout;
