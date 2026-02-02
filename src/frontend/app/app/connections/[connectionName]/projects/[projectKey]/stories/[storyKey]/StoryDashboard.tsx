"use client";

import React, { use, useMemo } from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import { Analytics, Assistant, EmojiObjects, Code } from "@mui/icons-material";
import { useParams, useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SessionStartForm } from "@/components/SessionStartForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { useStoryDashboardQuery } from "@/hooks/queries/useDashboardQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useTranslations } from "next-intl";
import type {
  ConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/connection";
import { useStoryDetailsQuery } from "@/hooks/queries/useConnectionQueries";

const StoryDashboard: React.FC = () => {
  const t = useTranslations("dashboard.StoryDashboard");
  const ts = useTranslations("dashboard.stats");
  const theme = useTheme();
  const router = useRouter();

  const params = useParams();
  const { connectionName, projectKey, storyKey, basePath } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
      storyKey: params.storyKey as string,
      basePath: `/app/connections/${params.connectionName}/projects/${params.projectKey}/stories/${params.storyKey}`,
    };
  }, [params]);

  const {
    selectedConnection: selectedConnection,
    setSelectedConnection: setSelectedConnection,
    selectedProject: selectedProject,
    setSelectedProject: setSelectedProject,
    selectedStory: selectedStory,
    setSelectedStory: setSelectedStory,
    connections: connections,
    projects: projects,
    stories: stories,
  } = useWorkspaceStore();

  const { data: dashboardData, isLoading } = useStoryDashboardQuery(
    connectionName,
    projectKey,
    storyKey,
  );

  const { data: storyDetailsData } = useStoryDetailsQuery(
    connectionName,
    projectKey,
    storyKey,
  );

  const dashboard = useMemo(() => dashboardData?.data || null, [dashboardData]);
  const storyDetails = useMemo(
    () => storyDetailsData?.data || null,
    [storyDetailsData],
  );

  const handleConnectionChange = async (conn: ConnectionDto | null) => {
    setSelectedConnection(conn);
    setSelectedProject(null);
    setSelectedStory(null);
  };

  const handleProjectChange = async (proj: ProjectDto | null) => {
    setSelectedProject(proj);
    setSelectedStory(null);
  };

  const handleStoryChange = async (story: StorySummary | null) => {
    setSelectedStory(story);
  };

  const handleFilter = async () => {
    if (selectedConnection && selectedProject) {
      if (selectedStory) {
        router.push(
          `/app/connections/${selectedConnection.name}/projects/${selectedProject.key}/stories/${selectedStory.key}`,
        );
      } else {
        router.push(
          `/app/connections/${selectedConnection.name}/projects/${selectedProject.key}`,
        );
      }
    }
  };

  const handleNavigate = async (path: string) => {
    router.push(`${basePath}/${path}`);
  };

  const stats = dashboard
    ? [
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
        selectedStory
          ? `${selectedStory.key} - ${selectedStory.summary}`
          : undefined
      }
      basePath={basePath}
      filterSectionTitle={t("selectStory")}
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
              bgcolor: "background.paper",
            }}
          >
            <StatsGrid stats={stats} title={t("overview")} />
          </Paper>

          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 1,
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              {t("storyDetails")}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="text.secondary"
                >
                  {t("key")}:
                </Typography>
                <Typography variant="body1" color="primary.main">
                  {storyKey}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  flexDirection: "column",
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="text.secondary"
                  >
                    {t("summary")}:
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    {storyDetails?.summary || t("noSummary")}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="text.secondary"
                  >
                    {t("description")}:
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    {storyDetails?.description || t("noDescription")}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </>
      ) : (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: "background.paper",
            textAlign: "center",
          }}
        >
          <Typography variant="body1" color="text.secondary">
            {t("unableToLoad")}
          </Typography>
        </Paper>
      )}
    </DashboardLayout>
  );
};

export default StoryDashboard;
