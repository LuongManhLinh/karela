"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ProjectDto, StorySummary } from "@/types/connection";
import {
  useAnalysisSummariesByProjectQuery,
  useRunAnalysisMutation,
  useAnalysisSummariesByStoryQuery,
  useAnalysisSummariesByConnectionQuery,
} from "@/hooks/queries/useAnalysisQueries";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useWebSocketContext } from "@/providers/WebSocketProvider";
import PageLayout from "../PageLayout";
import { useTranslations } from "next-intl";
import { PageLevel } from "@/types";
import { useRouter } from "next/navigation";
import {
  Box,
  Chip,
  ChipProps,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  Skeleton,
  Typography,
} from "@mui/material";
import { scrollBarSx } from "@/constants/scrollBarSx";

const getStatusColor = (status?: string): ChipProps["color"] => {
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
  level: PageLevel;
  projectKey?: string;
  storyKey?: string; // Required if level is "story"
  idOrKey?: string;
}

const AnalysisLayout: React.FC<AnalysisPageLayoutProps> = ({
  children,
  level,
  projectKey,
  storyKey,
  idOrKey,
}) => {
  const t = useTranslations("analysis.AnalysisLayout");
  const tSessionList = useTranslations("SessionList");
  const router = useRouter();
  const { setHeaderProjectKey, setHeaderStoryKey } = useWorkspaceStore();

  const [selectedAnalysisKey, setSelectedAnalysisKey] = useState<string | null>(
    idOrKey || null,
  );

  const connectionQuery = useAnalysisSummariesByConnectionQuery();
  const projectQuery = useAnalysisSummariesByProjectQuery(projectKey);
  const storyQuery = useAnalysisSummariesByStoryQuery(projectKey, storyKey);
  const currentQuery =
    level === "connection"
      ? connectionQuery
      : level === "project"
        ? projectQuery
        : storyQuery;

  // Analysis Hooks
  const {
    data: summariesData,
    isLoading: isSummariesLoading,
    refetch: refetchSummaries,
  } = currentQuery;
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

    const handleMessage = (data: unknown) => {
      const status = (data as { status?: string })?.status;
      if (status === "DONE" || status === "FAILED") {
        queryClient.invalidateQueries({ queryKey: ["analysis", "summaries"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["analysis", "summaries"] });
      }
    };

    runningIds.forEach((id) => {
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
    if (level === "connection") {
      router.push(`/app/analyses/${analysisKey}`);
      return;
    }
    if (level === "story") {
      router.push(
        `/app/projects/${projectKey}/stories/${storyKey}/analyses/${analysisKey}`,
      );
      return;
    }
    router.push(`/app/projects/${projectKey}/analyses/${analysisKey}`);
  };

  const handleRunAnalysis = async (
    project: ProjectDto,
    story?: StorySummary,
  ) => {
    try {
      let analysisType: "ALL" | "TARGETED" = "ALL";
      let targetStoryKey: string | undefined = undefined;
      if (story) {
        analysisType = "TARGETED";
        targetStoryKey = story.key;
      }

      await runAnalysis({
        projectKey: project.key,
        data: {
          analysis_type: analysisType,
          target_story_key: targetStoryKey,
        },
      });
      await refetchSummaries();
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || t("failedToStartAnalysis");
      console.error(errorMessage);
    }
    return null;
  };

  const sessionsComponent = (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {isSummariesLoading ? (
        <List
          sx={{
            flex: 1,
            px: 1,
            minHeight: 0,
            overflowY: "auto",
            ...scrollBarSx,
          }}
        >
          {[1, 2, 3].map((idx) => (
            <ListItem
              key={`analysis-skeleton-${idx}`}
              disablePadding
              sx={{ mb: 1 }}
            >
              <Box
                sx={{
                  width: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  px: 1.5,
                  py: 1,
                }}
              >
                <Skeleton variant="text" width="50%" />
                <Skeleton variant="rounded" width={190} height={22} />
                <Skeleton variant="text" width="70%" />
              </Box>
            </ListItem>
          ))}
        </List>
      ) : summaries.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, px: 2 }}
        >
          {t("noAnalysesYet")}
        </Typography>
      ) : (
        <List
          sx={{
            flex: 1,
            px: 1,
            minHeight: 0,
            overflowY: "auto",
            ...scrollBarSx,
          }}
        >
          {summaries.map((summary) => {
            const isSelected = selectedAnalysisKey === summary.key;
            const isRunning =
              summary.status === "IN_PROGRESS" || summary.status === "PENDING";

            return (
              <ListItem key={summary.key} disablePadding sx={{ mb: 0.75 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => handleSelectAnalysis(summary.key)}
                  sx={{
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: isSelected ? "primary.main" : "divider",
                    alignItems: "flex-start",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  {isRunning && (
                    <LinearProgress
                      sx={{ width: "100%", height: 4, borderRadius: 2 }}
                      color="inherit"
                    />
                  )}
                  <Box sx={{ width: "100%" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {summary.key}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.4 }}
                    >
                      {summary.created_at
                        ? new Date(summary.created_at).toLocaleString()
                        : ""}
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.75,
                      }}
                    >
                      <Chip
                        size="small"
                        label={`${tSessionList("project")}: ${summary.project_key}`}
                      />
                      {summary.story_key && (
                        <Chip
                          size="small"
                          label={`${tSessionList("story")}: ${summary.story_key}`}
                        />
                      )}
                      <Chip
                        size="small"
                        label={`${t("status")}: ${summary.status}`}
                        color={getStatusColor(summary.status)}
                      />
                      {summary.type && (
                        <Chip
                          size="small"
                          color="info"
                          label={`${t("type")}: ${t(summary.type)}`}
                        />
                      )}
                      <Chip
                        size="small"
                        color="error"
                        label={`${summary.num_defects || 0} ${t("defects")}`}
                      />
                      <Chip
                        size="small"
                        color="warning"
                        label={`${summary.num_proposals || 0} ${t("proposals")}`}
                      />
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );

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
      headerText={t("headerText")}
      projectKey={projectKey}
      storyKey={storyKey}
      href="analyses"
      sessionsComponent={sessionsComponent}
      onNewLabel={t("runAnalysis")}
      dialogLabel={t("runAnalysis")}
      primaryAction={handleRunAnalysis}
      primaryActionLabel={t("run")}
    >
      {children}
    </PageLayout>
  );
};

export default AnalysisLayout;
