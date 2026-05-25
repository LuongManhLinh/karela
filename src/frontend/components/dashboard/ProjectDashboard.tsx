"use client";

import React, { useMemo, useState } from "react";
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
  FmdBadOutlined,
} from "@mui/icons-material";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import {
  useProjectDashboardQuery,
  useDashboardStoriesInfiniteQuery,
} from "@/hooks/queries/useConnectionQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useTranslations } from "next-intl";
import {
  ProjectDto,
  type StoryInfo,
  type StorySummary,
} from "@/types/connection";
import { scrollBarSx } from "@/constants/scrollBarSx";
import Link from "next/link";

const getReadinessColor = (score: number) => {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "error";
};

export const StoryCard: React.FC<{
  story: StoryInfo;
  href: string;
}> = ({ story, href }) => {
  return (
    <Grid
      size={{ xs: 12, sm: 6, md: 4 }}
      key={story.id}
      component={Link}
      href={href}
      sx={{ textDecoration: "none" }}
    >
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 1,
          cursor: "pointer",

          "&:hover": {
            boxShadow: 5,
            transform: "translateY(-2px)",
          },
          bgcolor: "primaryContainer",
          color: "onPrimaryContainer",
          transition: "all 0.2s ease-in-out",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={600}
            noWrap
            sx={{ flex: 1, mr: 1 }}
          >
            {story.key}
          </Typography>
        </Box>
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 1 }}
        >
          <Chip
            icon={<Analytics fontSize="small" />}
            label={story.analysis_count}
            size="small"
          />
          <Chip
            icon={<FmdBadOutlined fontSize="small" />}
            label={story.defect_count}
            size="small"
          />
          <Chip
            icon={<EmojiObjects fontSize="small" />}
            label={story.proposal_count}
            size="small"
          />
          <Chip
            icon={<Code fontSize="small" />}
            label={story.ac_count}
            size="small"
          />
        </Stack>
      </Paper>
    </Grid>
  );
};

const ProjectDashboard: React.FC = () => {
  const t = useTranslations("dashboard.ProjectDashboard");
  const ts = useTranslations("dashboard.stats");
  const theme = useTheme();
  const { connection, projects } = useWorkspaceStore();
  const params = useParams();
  const { projectKey, basePath, selectedProject } = useMemo(() => {
    const projectKey = params.projectKey as string;
    const selectedProject = projects.find((p) => p.key === projectKey) || null;
    return {
      projectKey: projectKey,
      basePath: `/app/projects/${params.projectKey}`,
      selectedProject: selectedProject,
    };
  }, [params]);
  // const router = useRouter();

  const { data: dashboardData, isLoading: isDashboardLoading } =
    useProjectDashboardQuery(projectKey);
  const dashboard = dashboardData?.data;

  const {
    data: storiesData,
    isLoading: isStoriesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDashboardStoriesInfiniteQuery(
    projectKey,
    12,
    dashboard?.num_stories || 0,
  );

  const stories = useMemo(() => {
    if (!storiesData) return [];
    return storiesData.pages.flatMap((page) => page.data || []);
  }, [storiesData]);

  const isLoading = isDashboardLoading || (isStoriesLoading && !stories.length);

  // const handleStoryClick = async (story: StorySummary) => {
  //   setSelectedStory(story);
  //   if (connection && selectedProject) {
  //     router.push(`${basePath}/stories/${story.key}`);
  //   }
  // };

  // const handleNavigate = async (path: string) => {
  //   router.push(`${basePath}/${path}`);
  // };

  const stats = dashboard
    ? [
        {
          title: ts("stories"),
          value: dashboard.num_stories,
          icon: <MenuBook fontSize="large" />,
          // onClick: () => handleNavigate("workspace"),
          href: `${basePath}/workspace`,
        },
        {
          title: ts("analyses"),
          value: dashboard.num_analyses,
          icon: <Analytics fontSize="large" />,
          // onClick: () => handleNavigate("analyses"),
          href: `${basePath}/analyses`,
        },
        {
          title: ts("chats"),
          value: dashboard.num_chats,
          icon: <Assistant fontSize="large" />,
          // onClick: () => handleNavigate("chats"),
          href: `${basePath}/chats`,
        },
        {
          title: ts("proposals"),
          value: dashboard.num_proposals,
          icon: <EmojiObjects fontSize="large" />,
          // onClick: () => handleNavigate("proposals"),
          href: `${basePath}/proposals`,
        },
        {
          title: ts("acs"),
          value: dashboard.num_acs,
          icon: <Code fontSize="large" />,
          // onClick: () => handleNavigate("acs"),
          href: `${basePath}/acs`,
        },
      ]
    : [];

  const readinessSection = (readiness_score: number) => {
    return (
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
                  value={readiness_score}
                  size={140}
                  thickness={4}
                  color={getReadinessColor(readiness_score)}
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
                    color={`${getReadinessColor(readiness_score)}.main`}
                  >
                    {Math.round(readiness_score)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  };

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
          {dashboard.readiness_score !== undefined &&
            readinessSection(dashboard.readiness_score)}
          {/* { readinessSection(dashboard.readiness_score ?? 0) } */}

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
              {stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  href={`${basePath}/stories/${story.key}`}
                />
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
                  {isFetchingNextPage
                    ? t("loadingMore")
                    : t("more", { defaultValue: "More" })}
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
