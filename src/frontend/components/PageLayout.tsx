"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceSessions } from "@/components/WorkspaceShell";
import type {
  ConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/connection";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import {
  DefaultSessionFilterDialog,
  SessionFilterDialog,
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
  connectionName: string;
  projectKey?: string;
  storyKey?: string;
  href: string;
  primarySessions: WorkspaceSessions;
  secondarySessions?: WorkspaceSessions;
  disablePrimaryAutoRoute?: boolean;
  disableSecondaryAutoRoute?: boolean;
  onNewLabel?: string;
  dialogLabel?: string;
  primaryAction?: (
    connection: ConnectionDto,
    project: ProjectDto,
    story?: StorySummary,
  ) => Promise<string | null | undefined>;
  primaryActionLabel?: string;
  secondaryAction?: (
    connection: ConnectionDto,
    project: ProjectDto,
    story?: StorySummary,
  ) => Promise<string | null | undefined>;
  secondaryActionLabel?: string;
  showStoryCheckbox?: boolean;
  requireStory?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  level,
  href,
  headerText,
  connectionName,
  projectKey,
  storyKey,
  primarySessions,
  secondarySessions,
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
}) => {
  const tCommon = useTranslations("Common");
  const tPage = useTranslations("PageLayout");
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const {
    connections,
    selectedConnection,
    setSelectedConnection,
    selectedProject,
    setSelectedProject,
    selectedStory,
    setSelectedStory,
    runSelectedConnection,
    runSelectedProject,
    runSelectedStory,
    runProjects,
    runStories,
    setRunSelectedConnection,
    setRunSelectedProject,
    setRunSelectedStory,
    setRunProjects,
    setRunStories,
    headerProjectKey,
    headerStoryKey,
  } = useWorkspaceStore();

  const basePath = useMemo(() => {
    switch (level) {
      case "connection":
        return `/app/connections/${connectionName}`;
      case "project":
        return `/app/connections/${connectionName}/projects/${projectKey}`;
      case "story":
        return `/app/connections/${connectionName}/projects/${projectKey}/stories/${storyKey}`;
    }
  }, [level, selectedConnection, selectedProject, selectedStory]);

  const router = useRouter();

  const [dialogIsProjectsLoading, setDialogIsProjectsLoading] = useState(false);
  const [dialogIsStoriesLoading, setDialogIsStoriesLoading] = useState(false);

  const handleDialogConnectionChange = async (conn: ConnectionDto | null) => {
    setDialogIsProjectsLoading(true);
    setRunSelectedConnection(conn);
    setRunSelectedProject(null);
    setRunSelectedStory(null);
    setRunProjects([]);
    setRunStories([]);

    if (conn) {
      const projectsData = await connectionService.getProjects(conn.name);
      setRunProjects(projectsData?.data || []);
    }
    setDialogIsProjectsLoading(false);
  };

  const handleDialogProjectChange = async (proj: ProjectDto | null) => {
    setDialogIsStoriesLoading(true);
    setRunSelectedProject(proj);
    setRunSelectedStory(null);
    setRunStories([]);
    if (proj && runSelectedConnection) {
      const storiesData = await connectionService.getStorySummaries(
        runSelectedConnection.name,
        proj.key,
      );
      setRunStories(storiesData?.data || []);
    }
    setDialogIsStoriesLoading(false);
  };

  const handleDialogStoryChange = async (story: StorySummary | null) => {
    setRunSelectedStory(story);
  };

  const handleSelectPrimarySession = async (sessionId: string) => {
    primarySessions.onSelectSession &&
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
    connection: ConnectionDto,
    project: ProjectDto,
    story?: StorySummary,
  ) => {
    const newId =
      primaryAction && (await primaryAction(connection, project, story));
    setStartDialogOpen(false);
    if (newId) {
      setSelectedConnection(connection);
      setSelectedProject(project);
      setSelectedStory(story || null);
      router.push(`${basePath}/${href}/${newId}`);
    }
  };

  const handleSecondarySubmit = async (
    connection: ConnectionDto,
    project: ProjectDto,
    story?: StorySummary,
  ) => {
    const newId =
      secondaryAction && (await secondaryAction(connection, project, story));
    setStartDialogOpen(false);
    if (newId) {
      setSelectedConnection(connection);
      setSelectedProject(project);
      setSelectedStory(story || null);
      router.push(`${basePath}/${href}/${newId}`);
    }
  };

  return (
    <>
      <DoubleLayout
        leftChildren={
          <Box
            sx={{
              p: 2,
              height: "100%",
              flexDirection: "column",
              display: "flex",
              gap: 2,
            }}
          >
            <UrlInformation />
            <Button
              variant="contained"
              onClick={() => setStartDialogOpen(true)}
            >
              {onNewLabel || tPage("createNewItem")}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setFilterDialogOpen(true)}
            >
              {tCommon("filter")}
            </Button>
            <Divider />
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
          </Box>
        }
        rightChildren={children}
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
        connectionOptions={{
          options: connections,
          onChange: handleDialogConnectionChange,
          selectedOption: runSelectedConnection,
        }}
        projectOptions={{
          options: runProjects,
          onChange: handleDialogProjectChange,
          selectedOption: runSelectedProject,
          loading: dialogIsProjectsLoading,
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
