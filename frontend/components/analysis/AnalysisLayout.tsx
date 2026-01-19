"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import { WorkspaceShell } from "@/components/WorkspaceShell";
import { SessionItem } from "@/components/SessionList";
import type {
  ConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/connection";
import {
  useAnalysisSummariesByProjectQuery,
  useAnalysisStatusesQuery,
  useRunAnalysisMutation,
  useAnalysisSummariesByStoryQuery,
} from "@/hooks/queries/useAnalysisQueries";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useRouter } from "next/navigation";
import { NO_STORY_FILTER, USE_NO_STORY } from "@/constants/selectable";
import { SessionStartDialog } from "@/components/SessionStartDialog";

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
  level: "project" | "story";
}

const AnalysisLayout: React.FC<AnalysisPageLayoutProps> = ({
  children,
  level,
}) => {
  // Global State
  const {
    connections,
    projects,
    stories,
    selectedConnection,
    setSelectedConnection,
    selectedProject,
    setSelectedProject,
    selectedStory,
    setSelectedStory,
    headerProjectKey,
    setHeaderProjectKey,
    headerStoryKey,
    setHeaderStoryKey,
  } = useWorkspaceStore();

  const filterableStories =
    stories.length > 0 ? [NO_STORY_FILTER, ...stories] : [];

  // Analysis Hooks
  const { data: summariesData, isLoading: isSummariesLoading } =
    level === "project"
      ? useAnalysisSummariesByProjectQuery(
          selectedConnection?.id,
          selectedProject?.key,
        )
      : useAnalysisSummariesByStoryQuery(
          selectedConnection?.id,
          selectedProject?.key,
          selectedStory?.key,
        );
  const summaries = useMemo(() => summariesData?.data || [], [summariesData]);

  const basePath = useMemo(
    () =>
      level === "project"
        ? `/app/connections/${selectedConnection?.name}/projects/${selectedProject?.key}`
        : `/app/connections/${selectedConnection?.name}/projects/${selectedProject?.key}/stories/${selectedStory?.key}`,
    [level, selectedConnection, selectedProject, selectedStory],
  );

  const [selectedAnalysisKey, setSelectedAnalysisKey] = useState<string | null>(
    null,
  );

  const [pollingIds, setPollingIds] = useState<string[]>([]);
  const [startDialogOpen, setStartDialogOpen] = useState(false);

  const { data: statusesData } = useAnalysisStatusesQuery(pollingIds);

  // Mutations
  const { mutateAsync: runAnalysis, isPending: isRunning } =
    useRunAnalysisMutation();
  const queryClient = useQueryClient();
  const router = useRouter();

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

  const handleSelectAnalysis = async (analysisKey: string) => {
    setSelectedAnalysisKey(analysisKey);
    router.push(`${basePath}/${analysisKey}`);
  };

  const handleConnectionChange = async (conn: ConnectionDto | null) => {
    setSelectedConnection(conn);
    setSelectedProject(null);
    setSelectedStory(null);
  };

  const handleProjectChange = (proj: ProjectDto | null) => {
    setSelectedProject(proj);
    setSelectedStory(null);
  };

  const handleStoryChange = (story: StorySummary | null) => {
    setSelectedStory(story);
  };

  const handleFilter = () => {
    if (selectedConnection && selectedProject) {
      if (selectedStory && selectedStory.id !== NO_STORY_FILTER.id) {
        router.push(
          `/app/connections/${selectedConnection.name}/projects/${selectedProject.key}/stories/${selectedStory.key}/analyses`,
        );
      } else {
        router.push(
          `/app/connections/${selectedConnection.name}/projects/${selectedProject.key}/analyses`,
        );
      }
    }
  };

  const handleRunAnalysis = async (
    connection: ConnectionDto,
    project: ProjectDto,
    story: StorySummary,
  ) => {
    try {
      let analysisType: "ALL" | "TARGETED" = "ALL";
      let targetStoryKey: string | undefined = undefined;
      if (story.id !== "none") {
        analysisType = "TARGETED";
        targetStoryKey = story.key;
      }

      await runAnalysis({
        connectionId: connection.id,
        projectKey: project.key,
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
        id: summary.key,
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

      if (summary.key === selectedAnalysisKey) {
        setHeaderProjectKey(summary.project_key);
        setHeaderStoryKey(summary.story_key || "");
      }
    });
    return items;
  }, [summaries]);

  return (
    <>
      <WorkspaceShell
        connectionOptions={{
          options: connections,
          onChange: handleConnectionChange,
          selectedOption: selectedConnection,
        }}
        projectOptions={{
          options: projects,
          onChange: handleProjectChange,
          selectedOption: selectedProject,
        }}
        storyOptions={{
          options: filterableStories,
          onChange: handleStoryChange,
          selectedOption: selectedStory,
        }}
        primaryAction={{
          label: "Filter",
          onClick: handleFilter,
        }}
        secondaryAction={{
          label: "Run Analysis",
          onClick: () => setStartDialogOpen(true),
        }}
        sessions={sessionItems}
        selectedSessionId={selectedAnalysisKey}
        onSelectSession={handleSelectAnalysis}
        loadingSessions={isSummariesLoading}
        emptyStateText="No analyses yet"
        sessionListLabel="Analyses"
        rightChildren={children}
        headerText="Analysis"
        headerProjectKey={headerProjectKey || ""}
        headerStoryKey={headerStoryKey || ""}
        appBarTransparent
        basePath={`/app/connections/${selectedConnection?.name}/projects/${selectedProject?.key}`}
      />
      <SessionStartDialog
        open={startDialogOpen}
        onClose={() => setStartDialogOpen(false)}
        title="Run Analysis"
        connectionOptions={{
          options: connections,
          selectedOption: selectedConnection,
        }}
        projectOptions={{
          options: projects,
          selectedOption: selectedProject,
        }}
        storyOptions={{
          options: [USE_NO_STORY, ...stories],
          selectedOption:
            selectedStory?.id === NO_STORY_FILTER.id
              ? USE_NO_STORY
              : selectedStory,
        }}
        onPrimarySubmit={handleRunAnalysis}
        primaryLabel="Run"
      />
    </>
  );
};

export default AnalysisLayout;
