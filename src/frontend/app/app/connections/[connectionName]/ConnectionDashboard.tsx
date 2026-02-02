"use client";

import React, { useMemo } from "react";
import { Box, Paper, Typography, Grid } from "@mui/material";
import {
  Analytics,
  Assistant,
  EmojiObjects,
  Code,
  Folder,
} from "@mui/icons-material";
import { useParams, useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { ProjectListSection } from "@/components/dashboard/ProjectListSection";
import { useConnectionDashboardQuery } from "@/hooks/queries/useDashboardQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import type { ProjectDto } from "@/types/connection";
import { useTranslations } from "next-intl";

const ConnectionDashboard: React.FC = () => {
  const params = useParams();
  const { connectionName, basePath } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      basePath: `/app/connections/${params.connectionName}`,
    };
  }, [params]);
  const router = useRouter();

  const t = useTranslations("dashboard.ConnectionDashboard");
  const ts = useTranslations("dashboard.stats");

  const { selectedConnection, setSelectedProject } = useWorkspaceStore();

  const { data: dashboardData, isLoading } =
    useConnectionDashboardQuery(connectionName);

  const dashboard = useMemo(() => dashboardData?.data || null, [dashboardData]);

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
          title: ts("projects"),
          value: dashboard.num_projects,
          icon: <Folder fontSize="large" />,
          onClick: () => handleNavigate("projects"),
        },
        {
          title: ts("analyses"),
          value: dashboard.num_analyses,
          icon: <Analytics fontSize="large" />,
        },
        {
          title: ts("chats"),
          value: dashboard.num_chats,
          icon: <Assistant fontSize="large" />,
        },
        {
          title: ts("proposals"),
          value: dashboard.num_proposals,
          icon: <EmojiObjects fontSize="large" />,
        },
        {
          title: ts("acs"),
          value: dashboard.num_acs,
          icon: <Code fontSize="large" />,
        },
      ]
    : [];

  return (
    <DashboardLayout
      title={t("title")}
      subtitle={selectedConnection?.name}
      basePath={basePath}
      filterSectionTitle={t("connectionInformation")}
    >
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
              {t("projectsByActivity")}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <ProjectListSection
                  title={t("withAnalyses")}
                  projects={dashboard.projects_with_analyses}
                  emptyText={t("noProjectsWithAnalyses")}
                  onProjectClick={handleProjectClick}
                  maxHeight={250}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <ProjectListSection
                  title={t("withChats")}
                  projects={dashboard.projects_with_chats}
                  emptyText={t("noProjectsWithChats")}
                  onProjectClick={handleProjectClick}
                  maxHeight={250}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <ProjectListSection
                  title={t("withProposals")}
                  projects={dashboard.projects_with_proposals}
                  emptyText={t("noProjectsWithProposals")}
                  onProjectClick={handleProjectClick}
                  maxHeight={250}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <ProjectListSection
                  title={t("withAcs")}
                  projects={dashboard.projects_with_acs}
                  emptyText={t("noProjectsWithAcs")}
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

export default ConnectionDashboard;
