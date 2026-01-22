"use client";

import React, { useMemo } from "react";
import { Box, Container, Paper, Typography, Grid, Stack } from "@mui/material";
import {
  Analytics,
  Assistant,
  EmojiObjects,
  Code,
  MenuBook,
} from "@mui/icons-material";
import { useParams, useRouter } from "next/navigation";

import { Layout } from "@/components/Layout";
import { SessionStartForm } from "@/components/SessionStartForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { StoryListSection } from "@/components/dashboard/StoryListSection";
import { useProjectDashboardQuery } from "@/hooks/queries/useDashboardQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import type {
  ConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/connection";

const ProjectDashboard: React.FC = () => {
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
    selectedConnection,
    setSelectedConnection,
    selectedProject,
    setSelectedProject,
    setSelectedStory,
    connections,
    projects,
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
          title: "Stories",
          value: dashboard.num_stories,
          icon: <MenuBook fontSize="large" />,
        },
        {
          title: "Analyses",
          value: dashboard.num_analyses,
          icon: <Analytics fontSize="large" />,
          onClick: () => handleNavigate("analyses"),
        },
        {
          title: "Chats",
          value: dashboard.num_chats,
          icon: <Assistant fontSize="large" />,
          onClick: () => handleNavigate("chats"),
        },
        {
          title: "Proposals",
          value: dashboard.num_proposals,
          icon: <EmojiObjects fontSize="large" />,
          onClick: () => handleNavigate("proposals"),
        },
        {
          title: "Acceptance Criteria",
          value: dashboard.num_acs,
          icon: <Code fontSize="large" />,
          onClick: () => handleNavigate("ac"),
        },
      ]
    : [];

  return (
    <Layout
      appBarLeftContent={
        <Stack direction="row" alignItems="center" spacing={2} py={2}>
          <Typography variant="h5">Project Dashboard</Typography>
          {selectedProject && (
            <Typography variant="h6" color="text.secondary">
              {selectedProject.key} - {selectedProject.name}
            </Typography>
          )}
        </Stack>
      }
      appBarTransparent
      basePath={basePath}
    >
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, overflowY: "auto" }}>
        {/* Filter Section */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 1,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Select Project
          </Typography>
          <SessionStartForm
            connectionOptions={{
              options: connections,
              selectedOption: selectedConnection,
              onChange: handleConnectionChange,
            }}
            projectOptions={{
              options: projects,
              selectedOption: selectedProject,
              onChange: handleProjectChange,
            }}
            primaryAction={{
              label: "Filter",
              onClick: handleFilter,
            }}
          />
        </Paper>

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
              <StatsGrid stats={stats} title="Overview" />
            </Paper>

            {/* Story Lists */}
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 1,
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Stories by Activity
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StoryListSection
                    title="With Analyses"
                    stories={dashboard.stories_with_analyses}
                    emptyText="No stories with analyses"
                    onStoryClick={handleStoryClick}
                    maxHeight={250}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StoryListSection
                    title="With Chats"
                    stories={dashboard.stories_with_chats}
                    emptyText="No stories with chats"
                    onStoryClick={handleStoryClick}
                    maxHeight={250}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StoryListSection
                    title="With Proposals"
                    stories={dashboard.stories_with_proposals}
                    emptyText="No stories with proposals"
                    onStoryClick={handleStoryClick}
                    maxHeight={250}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StoryListSection
                    title="With ACs"
                    stories={dashboard.stories_with_acs}
                    emptyText="No stories with ACs"
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
              Unable to load dashboard data
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
              Please select a connection and project to view the dashboard
            </Typography>
          </Paper>
        )}
      </Container>
    </Layout>
  );
};

export default ProjectDashboard;
