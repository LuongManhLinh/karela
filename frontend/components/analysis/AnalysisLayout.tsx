"use client";

import React, { useEffect, useMemo, useState } from "react";
import type {
  ConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/connection";
import { SessionItem } from "@/components/SessionList";
import {
  useAnalysisSummariesByProjectQuery,
  useRunAnalysisMutation,
  useAnalysisSummariesByStoryQuery,
} from "@/hooks/queries/useAnalysisQueries";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { USE_NO_STORY } from "@/constants/selectable";
import { useWebSocketContext } from "@/providers/WebSocketProvider";
import PageLayout from "../PageLayout";

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
  const {
    selectedConnection,
    selectedProject,
    selectedStory,
    setHeaderProjectKey,
    setHeaderStoryKey,
  } = useWorkspaceStore();

  const [selectedAnalysisKey, setSelectedAnalysisKey] = useState<string | null>(
    null,
  );

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

  // Mutations
  const { mutateAsync: runAnalysis } = useRunAnalysisMutation();
  const queryClient = useQueryClient();

  // WebSocket
  const { subscribe, unsubscribe } = useWebSocketContext();

  useEffect(() => {
    const runningIds = summaries
      .filter((s) => s.status === "IN_PROGRESS" || s.status === "PENDING")
      .map((s) => s.id);

    const handleMessage = (data: any) => {
      if (data.status === "DONE" || data.status === "FAILED") {
        queryClient.invalidateQueries({ queryKey: ["analysis", "summaries"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["analysis", "summaries"] });
      }
    };

    runningIds.forEach((id) => {
      console.log(
        "In AnalysisLayout, Subscribing to analysis updates for ID:",
        id,
      );
      subscribe(`analysis:${id}`, handleMessage);
    });

    return () => {
      runningIds.forEach((id) => {
        unsubscribe(`analysis:${id}`, handleMessage);
      });
    };
  }, [summaries, subscribe, unsubscribe, queryClient]);

  const handleSelectAnalysis = async (analysisKey: string) => {
    setSelectedAnalysisKey(analysisKey);
  };

  const handleRunAnalysis = async (
    connection: ConnectionDto,
    project: ProjectDto,
    story: StorySummary,
  ) => {
    try {
      let analysisType: "ALL" | "TARGETED" = "ALL";
      let targetStoryKey: string | undefined = undefined;
      if (story.id !== USE_NO_STORY.id) {
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
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to start analysis";
      console.error(errorMessage);
    }
    return null;
  };

  const sessionItems = useMemo<SessionItem[]>(() => {
    return summaries.map((summary) => ({
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
      running: summary.status === "IN_PROGRESS" || summary.status === "PENDING",
    }));
  }, [summaries]);

  // Update header keys in useEffect to avoid setState during render
  useEffect(() => {
    const selectedSummary = summaries.find(
      (s) => s.key === selectedAnalysisKey,
    );
    if (selectedSummary) {
      setHeaderProjectKey(selectedSummary.project_key);
      setHeaderStoryKey(selectedSummary.story_key || "");
    }
  }, [summaries, selectedAnalysisKey, setHeaderProjectKey, setHeaderStoryKey]);

  return (
    <PageLayout
      level={level}
      href="analyses"
      primarySessions={{
        sessions: sessionItems,
        selectedSessionId: selectedAnalysisKey,
        onSelectSession: handleSelectAnalysis,
        loading: isSummariesLoading,
        emptyStateText: "No analyses yet",
        label: "Analyses",
      }}
      onNewLabel="Run Analysis"
      dialogLabel="Run Analysis"
      primaryAction={handleRunAnalysis}
      primaryActionLabel="Run"
      useNoStoryFilter
      useNoStoryRunner
    >
      {children}
    </PageLayout>
  );
};

export default AnalysisLayout;
