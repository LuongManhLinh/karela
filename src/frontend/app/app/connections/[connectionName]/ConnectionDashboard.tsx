"use client";

import React, { useMemo } from "react";
import { Box, Container, Paper, Typography, Grid, Stack } from "@mui/material";
import {
  Analytics,
  Assistant,
  EmojiObjects,
  Code,
  Folder,
} from "@mui/icons-material";
import { useParams, useRouter } from "next/navigation";

import { Layout } from "@/components/Layout";
import { SessionStartForm } from "@/components/SessionStartForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { ProjectListSection } from "@/components/dashboard/ProjectListSection";
import { useConnectionDashboardQuery } from "@/hooks/queries/useDashboardQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import type { ConnectionDto, ProjectDto } from "@/types/connection";

const ConnectionDashboard: React.FC = () => {
  const params = useParams();
  const { connectionName, basePath } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      basePath: `/app/connections/${params.connectionName}`,
    };
  }, [params]);
  const router = useRouter();

  const {
    selectedConnection,
    setSelectedConnection,
    setSelectedProject,
    connections,
  } = useWorkspaceStore();

  const { data: dashboardData, isLoading } =
    useConnectionDashboardQuery(connectionName);

  const dashboard = useMemo(() => dashboardData?.data || null, [dashboardData]);
  console.log("Connection Dashboard Num Projects:", dashboard?.num_projects);

  const handleConnectionChange = async (conn: ConnectionDto | null) => {
    setSelectedConnection(conn);
    setSelectedProject(null);
  };

  const handleFilter = async () => {
    if (selectedConnection) {
      router.push(`/app/connections/${selectedConnection.name}`);
    }
  };

  const handleProjectClick = async (project: ProjectDto) => {
    setSelectedProject(project);
    if (selectedConnection) {
      router.push(`${basePath}/projects/${project.key}`);
    }
  };

  const handleNavigate = async (path: string) => {
    router.push(`${basePath}/${path}`);
  };

  const stats = dashboard
    ? [
        {
          title: "Projects",
          value: dashboard.num_projects,
          icon: <Folder fontSize="large" />,
          onClick: () => handleNavigate("projects"),
        },
        {
          title: "Analyses",
          value: dashboard.num_analyses,
          icon: <Analytics fontSize="large" />,
        },
        {
          title: "Chats",
          value: dashboard.num_chats,
          icon: <Assistant fontSize="large" />,
        },
        {
          title: "Proposals",
          value: dashboard.num_proposals,
          icon: <EmojiObjects fontSize="large" />,
        },
        {
          title: "Acceptance Criteria",
          value: dashboard.num_acs,
          icon: <Code fontSize="large" />,
        },
      ]
    : [];

  return (
    <Layout
      appBarLeftContent={
        <Stack direction="row" alignItems="center" spacing={2} py={2}>
          <Typography variant="h5">Connection Dashboard</Typography>
          {selectedConnection && (
            <Typography variant="h6" color="text.secondary">
              {selectedConnection.name}
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
            Select Connection
          </Typography>
          <SessionStartForm
            connectionOptions={{
              options: connections,
              selectedOption: selectedConnection,
              onChange: handleConnectionChange,
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

            {/* Project Lists */}
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 1,
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Projects by Activity
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <ProjectListSection
                    title="With Analyses"
                    projects={dashboard.projects_with_analyses}
                    emptyText="No projects with analyses"
                    onProjectClick={handleProjectClick}
                    maxHeight={250}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <ProjectListSection
                    title="With Chats"
                    projects={dashboard.projects_with_chats}
                    emptyText="No projects with chats"
                    onProjectClick={handleProjectClick}
                    maxHeight={250}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <ProjectListSection
                    title="With Proposals"
                    projects={dashboard.projects_with_proposals}
                    emptyText="No projects with proposals"
                    onProjectClick={handleProjectClick}
                    maxHeight={250}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <ProjectListSection
                    title="With ACs"
                    projects={dashboard.projects_with_acs}
                    emptyText="No projects with ACs"
                    onProjectClick={handleProjectClick}
                    maxHeight={250}
                  />
                </Grid>
              </Grid>
            </Paper>
          </>
        ) : selectedConnection ? (
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
              Please select a connection to view the dashboard
            </Typography>
          </Paper>
        )}
      </Container>
    </Layout>
  );
};

export default ConnectionDashboard;
