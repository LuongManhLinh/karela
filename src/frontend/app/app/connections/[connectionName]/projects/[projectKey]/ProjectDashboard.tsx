"use client";

import React, { useMemo } from "react";
import { Box, Paper, Typography, Grid } from "@mui/material";
import {
  Analytics,
  Assistant,
  EmojiObjects,
  Code,
  MenuBook,
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

const ProjectDashboard: React.FC = () => {
  const t = useTranslations("dashboard.ProjectDashboard");
  const ts = useTranslations("dashboard.stats");
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

  const handleConnectionChange = async (conn: ConnectionDto | null) => {
    setSelectedConnection(conn);
    setSelectedProject(null);
  };

  const handleProjectChange = async (proj: ProjectDto | null) => {
    setSelectedProject(proj);
  };

  const handleFilter = async () => {
    if (selectedConnection && selectedProject) {
      router.push(
        `/app/connections/${selectedConnection.name}/projects/${selectedProject.key}`,
      );
    }
  };
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
        <>
          {/* Statistics Grid */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 1,
            }}
          >
            <StatsGrid stats={stats} title={t("overview")} />
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
        </>
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
