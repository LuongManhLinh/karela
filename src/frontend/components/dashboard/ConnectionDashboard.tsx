"use client";

import React, { useMemo } from "react";
import { Box, Paper, Typography, Grid, Button, Chip, Stack } from "@mui/material";
import {
  Analytics,
  Assistant,
  EmojiObjects,
  Code,
  Folder,
  KeyboardArrowDown,
} from "@mui/icons-material";
import { useParams, useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { useConnectionDashboardQuery, useDashboardProjectsInfiniteQuery } from "@/hooks/queries/useConnectionQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import type { ProjectDto } from "@/types/connection";
import { useTranslations } from "next-intl";

const ConnectionDashboard: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  const t = useTranslations("dashboard.ConnectionDashboard");
  const ts = useTranslations("dashboard.stats");

  const basePath = `/app`;

  const { connection, setSelectedProject } = useWorkspaceStore();

  const { data: dashboardData, isLoading: isDashboardLoading } = useConnectionDashboardQuery();
  const dashboard = dashboardData?.data;

  const {
    data: projectsData,
    isLoading: isProjectsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDashboardProjectsInfiniteQuery(5, dashboard?.num_projects || 0);

  const projects = useMemo(() => {
    if (!projectsData) return [];
    return projectsData.pages.flatMap((page) => page.data || []);
  }, [projectsData]);

  const isLoading = isDashboardLoading || (isProjectsLoading && !projects.length);

  const handleProjectClick = async (project: ProjectDto) => {
    setSelectedProject(project);
    if (connection) {
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
          onClick: () => handleNavigate("acs"),
        },
      ]
    : [];

  return (
    <DashboardLayout
      title={t("title")}
      subtitle={connection?.name}
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
        <Box sx={{ mb: 3 }}>
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
              {t("projects")}
            </Typography>
            <Grid container spacing={2}>
              {projects.map((project) => project && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() => handleProjectClick(project as any)}
                  >
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                      {project.name || project.key}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {project.key}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      <Chip
                        icon={<Analytics fontSize="small" />}
                        label={project.analysis_count}
                        size="small"
                        color={project.analysis_count > 0 ? "primary" : "default"}
                      />
                      <Chip
                        icon={<Assistant fontSize="small" />}
                        label={project.chat_count}
                        size="small"
                        color={project.chat_count > 0 ? "secondary" : "default"}
                      />
                      <Chip
                        icon={<EmojiObjects fontSize="small" />}
                        label={project.proposal_count}
                        size="small"
                        color={project.proposal_count > 0 ? "warning" : "default"}
                      />
                      <Chip
                        icon={<Code fontSize="small" />}
                        label={project.ac_count}
                        size="small"
                        color={project.ac_count > 0 ? "success" : "default"}
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
      ) : connection ? (
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
