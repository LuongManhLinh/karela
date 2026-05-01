"use client";

import React, { useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  useTheme,
  Button,
  Chip,
  Stack,
} from "@mui/material";
import {
  Analytics,
  Assistant,
  EmojiObjects,
  Code,
  MenuBook,
  KeyboardArrowDown,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import { useParams, useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { useProjectDashboardQuery, useDashboardStoriesInfiniteQuery } from "@/hooks/queries/useConnectionQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useTranslations } from "next-intl";
import type { StorySummary } from "@/types/connection";
import { scrollBarSx } from "@/constants/scrollBarSx";

const getReadinessColor = (score: number) => {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "error";
};

const ProjectDashboard: React.FC = () => {
  const t = useTranslations("dashboard.ProjectDashboard");
  const ts = useTranslations("dashboard.stats");
  const theme = useTheme();
  const params = useParams();
  const { projectKey, basePath } = useMemo(() => {
    return {
      projectKey: params.projectKey as string,
      basePath: `/app/projects/${params.projectKey}`,
    };
  }, [params]);
  const router = useRouter();

  const {
    connection,
    selectedProject,

    setSelectedStory,
  } = useWorkspaceStore();

  const { data: dashboardData, isLoading: isDashboardLoading } = useProjectDashboardQuery(projectKey);
  const dashboard = dashboardData?.data;

  const {
    data: storiesData,
    isLoading: isStoriesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDashboardStoriesInfiniteQuery(projectKey, 10, dashboard?.num_stories || 0);

  const stories = useMemo(() => {
    if (!storiesData) return [];
    return storiesData.pages.flatMap((page) => page.data || []);
  }, [storiesData]);

  const isLoading = isDashboardLoading || (isStoriesLoading && !stories.length);

  const handleStoryClick = async (story: StorySummary) => {
    setSelectedStory(story);
    if (connection && selectedProject) {
      router.push(`${basePath}/stories/${story.key}`);
    }
  };

  const handleNavigate = async (path: string) => {
    router.push(`${basePath}/${path}`);
  };

  const stats = dashboard
    ? [
        {
          title: ts("stories"),
          value: dashboard.num_stories,
          icon: <MenuBook fontSize="large" />,
          onClick: () => handleNavigate("workspace"),
        },
        {
          title: ts("analyses"),
          value: dashboard.num_analyses,
          icon: <Analytics fontSize="large" />,
          onClick: () => handleNavigate("analyses"),
        },
        {
          title: ts("chats"),
          value: dashboard.num_chats,
          icon: <Assistant fontSize="large" />,
          onClick: () => handleNavigate("chats"),
        },
        {
          title: ts("proposals"),
          value: dashboard.num_proposals,
          icon: <EmojiObjects fontSize="large" />,
          onClick: () => handleNavigate("proposals"),
        },
        {
          title: ts("acs"),
          value: dashboard.num_acs,
          icon: <Code fontSize="large" />,
          onClick: () => handleNavigate("ac"),
        },
      ]
    : [];

  return (
    <DashboardLayout
      title={t("title")}
      subtitle={
        selectedProject
          ? `${selectedProject.key} - ${selectedProject.name}`
          : undefined
      }
      basePath={basePath}
      filterSectionTitle={t("selectProject")}
    >
      {/* Dashboard Content */}
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 300,
          }}
        >
          <LoadingSpinner />
        </Box>
      ) : dashboard ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            mb: 3,
          }}
        >
          {/* Statistics Grid */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 1,
            }}
          >
            <StatsGrid stats={stats} title={t("overview")} />
          </Paper>

          {/* Readiness section */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 1,
            }}
          >
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              {t("readinessScore")}
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              {/* Readiness Score Gauge */}
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 2,
                  }}
                >
                  <Box sx={{ position: "relative", display: "inline-flex" }}>
                    <CircularProgress
                      variant="determinate"
                      value={100}
                      size={140}
                      thickness={4}
                      sx={{
                        color:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.08)",
                        position: "absolute",
                      }}
                    />
                    <CircularProgress
                      variant="determinate"
                      value={dashboard.readiness_score}
                      size={140}
                      thickness={4}
                      color={getReadinessColor(dashboard.readiness_score)}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: "absolute",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="h3"
                        fontWeight="bold"
                        color={`${getReadinessColor(dashboard.readiness_score)}.main`}
                      >
                        {Math.round(dashboard.readiness_score)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Story Lists */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 1,
            }}
          >
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              {t("stories")}
            </Typography>
            <Grid container spacing={2}>
              {stories.map((story) => story && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={story.id}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() => handleStoryClick(story as any)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ flex: 1, mr: 1 }}>
                        {story.key}
                      </Typography>
                      <Chip
                        icon={story.is_ready ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
                        label={story.is_ready ? t("ready", { defaultValue: "Ready" }) : t("notReady", { defaultValue: "Not Ready" })}
                        size="small"
                        color={story.is_ready ? "success" : "default"}
                        variant={story.is_ready ? "filled" : "outlined"}
                      />
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      <Chip
                        icon={<Analytics fontSize="small" />}
                        label={story.analysis_count}
                        size="small"
                        color={story.analysis_count > 0 ? "primary" : "default"}
                      />
                      <Chip
                        icon={<EmojiObjects fontSize="small" />}
                        label={story.proposal_count}
                        size="small"
                        color={story.proposal_count > 0 ? "warning" : "default"}
                      />
                      <Chip
                        icon={<Code fontSize="small" />}
                        label={story.ac_count}
                        size="small"
                        color={story.ac_count > 0 ? "success" : "default"}
                      />
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            {hasNextPage && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  endIcon={<KeyboardArrowDown />}
                >
                  {isFetchingNextPage ? t("loadingMore", { defaultValue: "Loading..." }) : t("more", { defaultValue: "More" })}
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      ) : connection && selectedProject ? (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 1,
            bgcolor: "background.paper",
            textAlign: "center",
          }}
        >
          <Typography variant="body1" color="text.secondary">
            {t("unableToLoad")}
          </Typography>
        </Paper>
      ) : (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 1,
            bgcolor: "background.paper",
            textAlign: "center",
          }}
        >
          <Typography variant="body1" color="text.secondary">
            {t("selectToView")}
          </Typography>
        </Paper>
      )}
    </DashboardLayout>
  );
};

export default ProjectDashboard;
