"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceSessions } from "@/types/workspace";
import type { ProjectDto, StorySummary } from "@/types/connection";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import {
  DefaultSessionFilterDialog,
  SessionStartDialog,
} from "@/components/SessionDialog";

import { connectionService } from "@/services/connectionService";
import { useTranslations } from "next-intl";
import { PageLevel } from "@/types";
import HeaderContent from "./HeaderContent";
import { DoubleLayout } from "./Layout";
import { Box, Button, Divider, Typography } from "@mui/material";
import SessionList from "./SessionList";
import { UrlInformation } from "./UrlInformation";

export interface PageLayoutProps {
  children: React.ReactNode;
  level: PageLevel;
  headerText?: string;
  projectKey?: string;
  storyKey?: string;
  href: string;
  primarySessions?: WorkspaceSessions;
  secondarySessions?: WorkspaceSessions;
  sessionsComponent?: React.ReactNode;
  disablePrimaryAutoRoute?: boolean;
  disableSecondaryAutoRoute?: boolean;
  onNewLabel?: string;
  dialogLabel?: string;
  primaryAction?: (
    project: ProjectDto,
    story?: StorySummary,
  ) => Promise<string | null | undefined>;
  primaryActionLabel?: string;
  secondaryAction?: (
    project: ProjectDto,
    story?: StorySummary,
  ) => Promise<string | null | undefined>;
  secondaryActionLabel?: string;
  showStoryCheckbox?: boolean;
  requireStory?: boolean;
  createable?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  level,
  href,
  headerText,
  projectKey,
  storyKey,
  primarySessions,
  secondarySessions,
  sessionsComponent,
  disablePrimaryAutoRoute,
  disableSecondaryAutoRoute,
  onNewLabel,
  dialogLabel,
  primaryAction,
  secondaryAction,
  primaryActionLabel,
  secondaryActionLabel,
  showStoryCheckbox = true,
  requireStory = false,
  createable = true,
}) => {
  const tPage = useTranslations("PageLayout");
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const {
    selectedProject,
    setSelectedProject,
    selectedStory,
    setSelectedStory,
    runSelectedProject,
    runSelectedStory,
    projects,
    runStories,
    setRunSelectedProject,
    setRunSelectedStory,
    setRunStories,
    headerProjectKey,
    headerStoryKey,
  } = useWorkspaceStore();

  const basePath = useMemo(() => {
    switch (level) {
      case "connection":
        return `/app`;
      case "project":
        return `/app/projects/${projectKey}`;
      case "story":
        return `/app/projects/${projectKey}/stories/${storyKey}`;
    }
  }, [level, selectedProject, selectedStory]);

  const router = useRouter();

  const [dialogIsStoriesLoading, setDialogIsStoriesLoading] = useState(false);

  const handleDialogProjectChange = async (proj: ProjectDto | null) => {
    setDialogIsStoriesLoading(true);
    setRunSelectedProject(proj);
    setRunSelectedStory(null);
    setRunStories([]);
    if (proj) {
      const storiesData = await connectionService.getStorySummaries(proj.key);
      setRunStories(storiesData?.data || []);
    }
    setDialogIsStoriesLoading(false);
  };

  const handleDialogStoryChange = async (story: StorySummary | null) => {
    setRunSelectedStory(story);
  };

  const handleSelectPrimarySession = async (sessionId: string) => {
    primarySessions?.onSelectSession &&
      primarySessions.onSelectSession(sessionId);
    if (!disablePrimaryAutoRoute) {
      router.push(`${basePath}/${href}/${sessionId}`);
    }
  };

  const handleSelectSecondarySession = async (sessionId: string) => {
    secondarySessions?.onSelectSession &&
      secondarySessions.onSelectSession(sessionId);
    if (!disableSecondaryAutoRoute) {
      router.push(`${basePath}/${href}/${sessionId}`);
    }
  };

  const handlePrimarySubmit = async (
    project: ProjectDto,
    story?: StorySummary,
  ) => {
    const newId = primaryAction && (await primaryAction(project, story));
    setStartDialogOpen(false);
    if (newId) {
      setSelectedProject(project);
      setSelectedStory(story || null);

      if (level === "connection") {
        router.push(`/app/${href}/${newId}`);
      } else if (level === "story" && story) {
        router.push(
          `/app/projects/${project.key}/stories/${story.key}/${href}/${newId}`,
        );
      } else {
        router.push(`/app/projects/${project.key}/${href}/${newId}`);
      }
    }
  };

  const handleSecondarySubmit = async (
    project: ProjectDto,
    story?: StorySummary,
  ) => {
    const newId = secondaryAction && (await secondaryAction(project, story));
    setStartDialogOpen(false);
    if (newId) {
      setSelectedProject(project);
      setSelectedStory(story || null);

      if (level === "connection") {
        router.push(`/app/${href}/${newId}`);
      } else if (level === "story" && story) {
        router.push(
          `/app/projects/${project.key}/stories/${story.key}/${href}/${newId}`,
        );
      } else {
        router.push(`/app/projects/${project.key}/${href}/${newId}`);
      }
    }
  };

  return (
    <>
      <DoubleLayout
        leftChildren={
          <Box
            sx={{
              height: "100%",
              minHeight: 0,
              flexDirection: "column",
              display: "flex",
              gap: 2,
            }}
          >
            <UrlInformation />
            {createable && (
              <Button
                variant="contained"
                onClick={() => setStartDialogOpen(true)}
                sx={{ mx: 2 }}
              >
                {onNewLabel || tPage("createNewItem")}
              </Button>
            )}
            <Divider />

            {sessionsComponent ? (
              sessionsComponent
            ) : (
              <>
                {primarySessions && (
                  <>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        textTransform: "uppercase",
                        color: "text.secondary",
                      }}
                    >
                      {primarySessions.label || "Sessions"}
                    </Typography>
                    <SessionList
                      sessions={primarySessions.sessions}
                      selectedId={primarySessions.selectedSessionId}
                      onSelect={handleSelectPrimarySession}
                      loading={primarySessions.loading}
                      emptyStateText={primarySessions.emptyStateText}
                    />
                  </>
                )}
                {secondarySessions && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        textTransform: "uppercase",

                        color: "text.secondary",
                      }}
                    >
                      {secondarySessions.label || "Sessions"}
                    </Typography>
                    <SessionList
                      sessions={secondarySessions.sessions}
                      selectedId={secondarySessions.selectedSessionId}
                      onSelect={handleSelectSecondarySession}
                      loading={secondarySessions.loading}
                      emptyStateText={secondarySessions.emptyStateText}
                    />
                  </>
                )}
              </>
            )}
          </Box>
        }
        rightChildren={children}
        onFilterClick={() => setFilterDialogOpen(true)}
        appBarLeftContent={
          <HeaderContent
            headerText={headerText}
            headerProjectKey={headerProjectKey}
            headerStoryKey={headerStoryKey}
          />
        }
        appBarTransparent={true}
        basePath={basePath}
      />
      <DefaultSessionFilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        href={href}
      />
      <SessionStartDialog
        open={startDialogOpen}
        onClose={() => setStartDialogOpen(false)}
        title={dialogLabel || tPage("createNewItem")}
        projectOptions={{
          options: projects,
          onChange: handleDialogProjectChange,
          selectedOption: runSelectedProject,
        }}
        storyOptions={{
          options: runStories,
          onChange: handleDialogStoryChange,
          selectedOption: runSelectedStory,
          loading: dialogIsStoriesLoading,
        }}
        onPrimarySubmit={primaryAction ? handlePrimarySubmit : undefined}
        primaryLabel={primaryActionLabel}
        onSecondarySubmit={secondaryAction ? handleSecondarySubmit : undefined}
        secondaryLabel={secondaryActionLabel}
        showUseStoryCheckbox={showStoryCheckbox}
        requireStory={requireStory}
      />
    </>
  );
};

export default PageLayout;
