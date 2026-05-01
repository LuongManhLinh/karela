"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import PageLayout from "@/components/PageLayout";
import { useStorySummariesQuery } from "@/hooks/queries/useConnectionQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import {
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  Skeleton,
  Typography,
} from "@mui/material";
import { scrollBarSx } from "@/constants/scrollBarSx";

interface WorkspaceLayoutProps {
  children?: React.ReactNode;
  projectKey: string;
  storyKey?: string;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  children,
  projectKey,
  storyKey,
}) => {
  const t = useTranslations("workspace.WorkspaceLayout");
  const tSessionList = useTranslations("SessionList");
  const router = useRouter();
  const {
    setHeaderProjectKey,
    setHeaderStoryKey,
    setSelectedStory,
    setStories,
  } = useWorkspaceStore();

  const [selectedStoryKey, setSelectedStoryKey] = useState<string | null>(
    storyKey || null,
  );

  // Fetch story summaries for the project
  const { data: storiesData, isLoading: isStoriesLoading } =
    useStorySummariesQuery(projectKey);

  const storySummaries = useMemo(() => storiesData?.data || [], [storiesData]);

  // Update store when stories are fetched
  useEffect(() => {
    if (storySummaries.length > 0) {
      setStories(storySummaries);
    }
  }, [storySummaries, setStories]);

  // Update selected story key when storyKey prop changes
  useEffect(() => {
    setSelectedStoryKey(storyKey || null);
  }, [storyKey]);

  // Update header keys
  useEffect(() => {
    setHeaderProjectKey(projectKey);
    if (storyKey) {
      setHeaderStoryKey(storyKey);
      const selectedStory = storySummaries.find((s) => s.key === storyKey);
      if (selectedStory) {
        setSelectedStory(selectedStory);
      }
    } else {
      setHeaderStoryKey("");
    }
  }, [
    projectKey,
    storyKey,
    storySummaries,
    setHeaderProjectKey,
    setHeaderStoryKey,
    setSelectedStory,
  ]);

  const handleSelectStory = async (storyKey: string) => {
    setSelectedStoryKey(storyKey);
    const selectedStory = storySummaries.find((s) => s.key === storyKey);
    if (selectedStory) {
      setSelectedStory(selectedStory);
    }
    router.push(`/app/projects/${projectKey}/workspace/${storyKey}`);
  };

  const sessionsComponent = (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {isStoriesLoading ? (
        <List
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",

            ...scrollBarSx,
          }}
        >
          {[1, 2, 3, 4].map((idx) => (
            <ListItem
              key={`workspace-skeleton-${idx}`}
              disablePadding
              sx={{ mb: 1 }}
            >
              <Box
                sx={{
                  width: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  px: 1.5,
                  py: 1,
                }}
              >
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="85%" />
              </Box>
            </ListItem>
          ))}
        </List>
      ) : storySummaries.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, px: 2 }}
        >
          {t("noStoriesYet")}
        </Typography>
      ) : (
        <List
          sx={{
            flex: 1,
            minHeight: 0,
            px: 1,
            overflowY: "auto",
            ...scrollBarSx,
          }}
        >
          {storySummaries.map((story) => {
            const isSelected = selectedStoryKey === story.key;
            return (
              <ListItem key={story.key} disablePadding sx={{ mb: 0.75 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => handleSelectStory(story.key)}
                  sx={{
                    borderRadius: 1.5,
                    // border: "1px solid",
                    // borderColor: "divider",
                    bgcolor: "surfaceContainerHighest",
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{ width: "100%" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {story.key}
                    </Typography>
                    {story.summary && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.4 }}
                      >
                        {story.summary}
                      </Typography>
                    )}
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        label={`${tSessionList("story")}: ${story.key}`}
                      />
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );

  return (
    <PageLayout
      level="project"
      projectKey={projectKey}
      href="workspace"
      headerText={t("headerText")}
      sessionsComponent={sessionsComponent}
      disablePrimaryAutoRoute={false}
      createable={false}
    >
      {children}
    </PageLayout>
  );
};

export default WorkspaceLayout;
