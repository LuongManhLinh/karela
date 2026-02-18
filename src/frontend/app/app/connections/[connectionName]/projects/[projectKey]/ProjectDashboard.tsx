"use client";

import React, { useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  useTheme,
} from "@mui/material";
import {
  Analytics,
  Assistant,
  EmojiObjects,
  Code,
  MenuBook,
  CheckCircle,
} from "@mui/icons-material";
import { useParams, useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SessionStartForm } from "@/components/SessionStartForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { StoryListSection } from "@/components/dashboard/StoryListSection";
import { useProjectDashboardQuery } from "@/hooks/queries/useDashboardQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useTranslations } from "next-intl";
import type {
  ConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/connection";

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
  const { connectionName, projectKey, basePath } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
      basePath: `/app/connections/${params.connectionName}/projects/${params.projectKey}`,
    };
  }, [params]);
  const router = useRouter();

  const {
    selectedConnection: selectedConnection,
    setSelectedConnection: setSelectedConnection,
    selectedProject: selectedProject,
    setSelectedProject: setSelectedProject,
    setSelectedStory: setSelectedStory,
    connections: connections,
    projects: projects,
  } = useWorkspaceStore();

  const { data: dashboardData, isLoading } = useProjectDashboardQuery(
    connectionName,
    projectKey,
  );

  const dashboard = useMemo(() => dashboardData?.data || null, [dashboardData]);

  const handleStoryClick = async (story: StorySummary) => {
    setSelectedStory(story);
    if (selectedConnection && selectedProject) {
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
            <Grid container spacing={3}>
              {/* Readiness Score Gauge */}
              <Grid size={{ xs: 12, md: 4 }}>
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

              {/* Ready Stories List */}
              <Grid size={{ xs: 12, md: 8 }}>
                <StoryListSection
                  title={t("readyStories")}
                  stories={dashboard.ready_stories}
                  emptyText={t("noReadyStories")}
                  onStoryClick={handleStoryClick}
                  maxHeight={250}
                />
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
              {t("storiesByActivity")}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StoryListSection
                  title={t("withAnalyses")}
                  stories={dashboard.stories_with_analyses}
                  emptyText={t("noStoriesWithAnalyses")}
                  onStoryClick={handleStoryClick}
                  maxHeight={250}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StoryListSection
                  title={t("withChats")}
                  stories={dashboard.stories_with_chats}
                  emptyText={t("noStoriesWithChats")}
                  onStoryClick={handleStoryClick}
                  maxHeight={250}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StoryListSection
                  title={t("withProposals")}
                  stories={dashboard.stories_with_proposals}
                  emptyText={t("noStoriesWithProposals")}
                  onStoryClick={handleStoryClick}
                  maxHeight={250}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StoryListSection
                  title={t("withAcs")}
                  stories={dashboard.stories_with_acs}
                  emptyText={t("noStoriesWithAcs")}
                  onStoryClick={handleStoryClick}
                  maxHeight={250}
                />
              </Grid>
            </Grid>
          </Paper>
        </Box>
      ) : selectedConnection && selectedProject ? (
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
