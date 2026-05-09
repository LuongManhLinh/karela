"use client";

import React, { useMemo, useState } from "react";
import { Box, Paper, Stack, Switch, Typography } from "@mui/material";
import { Analytics, EmojiObjects, Code } from "@mui/icons-material";
import { useParams, useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { useStoryDashboardQuery } from "@/hooks/queries/useConnectionQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useTranslations } from "next-intl";
import { useStoryDetailsQuery } from "@/hooks/queries/useConnectionQueries";
import { MarkdownMessage } from "../chat/MarkdownMessage";

const StoryDashboard: React.FC = () => {
  const t = useTranslations("dashboard.StoryDashboard");
  const ts = useTranslations("dashboard.stats");
  const router = useRouter();

const { stories } = useWorkspaceStore();

  const params = useParams();
  const { projectKey, storyKey, selectedStory, basePath } = useMemo(() => {
    const storyKey = params.storyKey as string;
    const selectedStory = stories.find((s) => s.key === storyKey) || null;
    return {
      projectKey: params.projectKey as string,
      storyKey: storyKey,
      selectedStory: selectedStory,
      basePath: `/app/projects/${params.projectKey}/stories/${params.storyKey}`,
    };
  }, [params]);

  

  const [renderMarkdown, setRenderMarkdown] = useState(true);

  const { data: dashboardData, isLoading } = useStoryDashboardQuery(
    projectKey,
    storyKey,
  );

  const { data: storyDetailsData } = useStoryDetailsQuery(storyKey);

  const dashboard = useMemo(() => dashboardData?.data || null, [dashboardData]);
  const storyDetails = useMemo(
    () => storyDetailsData?.data || null,
    [storyDetailsData],
  );

  const handleNavigate = async (path: string) => {
    router.push(`${basePath}/${path}`);
  };

  const stats = dashboard
    ? [
        {
          title: ts("analyses"),
          value: dashboard.num_analyses,
          icon: <Analytics fontSize="large" />,
          // onClick: () => handleNavigate("analyses"),
          href: `${basePath}/analyses`,
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
                <Box sx={{ width: "100%" }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 1 }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="text.secondary"
                    >
                      {t("description")}:
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Markdown
                      </Typography>
                      <Switch
                        checked={renderMarkdown}
                        onChange={() => setRenderMarkdown((prev) => !prev)}
                        color="primary"
                        size="small"
                      />
                    </Stack>
                  </Stack>

                  {renderMarkdown ? (
                    <MarkdownMessage
                      content={storyDetails?.description || t("noDescription")}
                    />
                  ) : (
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{
                        whiteSpace: "pre-line",
                      }}
                    >
                      {storyDetails?.description || t("noDescription")}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
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
