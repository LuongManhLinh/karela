"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceSessions, WorkspaceShell } from "@/components/WorkspaceShell";
import type {
  ConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/connection";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { NO_STORY_FILTER, USE_NO_STORY } from "@/constants/selectable";
import { SessionStartDialog } from "@/components/SessionStartDialog";

import { connectionService } from "@/services/connectionService";

export interface PageLayoutProps {
  children: React.ReactNode;
  level: "project" | "story";
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
    story: StorySummary,
  ) => Promise<string | null | undefined>;
  primaryActionLabel?: string;
  secondaryAction?: (
    connection: ConnectionDto,
    project: ProjectDto,
    story: StorySummary,
  ) => Promise<string | null | undefined>;
  secondaryActionLabel?: string;
  useNoStoryFilter?: boolean;
  useNoStoryRunner?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  level,
  href,
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
  useNoStoryFilter,
  useNoStoryRunner,
}) => {
  const [startDialogOpen, setStartDialogOpen] = useState(false);

  const {
    connections,
    projects,
    stories,
    selectedConnection,
    setSelectedConnection,
    setProjects,
    selectedProject,
    setSelectedProject,
    setStories,
    selectedStory,
    setSelectedStory,
    headerProjectKey,
    headerStoryKey,
  } = useWorkspaceStore();

  const filterableStories = useMemo(() => {
    let storyOptions = stories;
    if (useNoStoryFilter && stories.length > 0) {
      storyOptions = [NO_STORY_FILTER, ...stories];
    }
    return storyOptions;
  }, [stories, useNoStoryFilter]);

  const basePath = useMemo(
    () =>
      level === "project"
        ? `/app/connections/${selectedConnection?.name}/projects/${selectedProject?.key}`
        : `/app/connections/${selectedConnection?.name}/projects/${selectedProject?.key}/stories/${selectedStory?.key}`,
    [level, selectedConnection, selectedProject, selectedStory],
  );

  const router = useRouter();

  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [isStoriesLoading, setIsStoriesLoading] = useState(false);

  const handleConnectionChange = async (conn: ConnectionDto | null) => {
    setIsProjectsLoading(true);
    setSelectedConnection(conn);
    setSelectedProject(null);
    setSelectedStory(null);

    if (conn) {
      const projectsData = await connectionService.getProjects(conn.id);
      setProjects(projectsData?.data || []);
    }
    setIsProjectsLoading(false);
  };

  const handleProjectChange = async (proj: ProjectDto | null) => {
    setIsStoriesLoading(true);
    setSelectedProject(proj);
    setSelectedStory(null);
    if (proj) {
      const storiesData = await connectionService.getStorySummaries(
        selectedConnection!.id,
        proj.key,
      );
      setStories(storiesData?.data || []);
    }
    setIsStoriesLoading(false);
  };

  const handleStoryChange = async (story: StorySummary | null) => {
    setSelectedStory(story);
  };

  const handleFilter = async () => {
    if (selectedConnection && selectedProject) {
      if (selectedStory && selectedStory.id !== NO_STORY_FILTER.id) {
        router.push(
          `/app/connections/${selectedConnection.id}/projects/${selectedProject.key}/stories/${selectedStory.key}/${href}`,
        );
      } else {
        router.push(
          `/app/connections/${selectedConnection.id}/projects/${selectedProject.key}/${href}`,
        );
      }
    }
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
    story: StorySummary,
  ) => {
    const newId =
      primaryAction && (await primaryAction(connection, project, story));
    setStartDialogOpen(false);
    if (newId) {
      setSelectedConnection(connection);
      setSelectedProject(project);
      setSelectedStory(story);
      router.push(`${basePath}/${href}/${newId}`);
    }
  };

  const handleSecondarySubmit = async (
    connection: ConnectionDto,
    project: ProjectDto,
    story: StorySummary,
  ) => {
    const newId =
      secondaryAction && (await secondaryAction(connection, project, story));
    setStartDialogOpen(false);
    if (newId) {
      setSelectedConnection(connection);
      setSelectedProject(project);
      setSelectedStory(story);
      router.push(`${basePath}/${href}/${newId}`);
    }
  };

  const getDialogSelectedStoryOption = () => {
    if (!selectedStory) {
      return null;
    }
    if (selectedStory.id !== NO_STORY_FILTER.id) {
      return selectedStory;
    }

    if (useNoStoryRunner) {
      return USE_NO_STORY;
    }

    return null;
  };

  return (
    <>
      <WorkspaceShell
        connectionOptions={{
          options: connections,
          onChange: handleConnectionChange,
          selectedOption: selectedConnection,
        }}
        projectOptions={{
          options: projects,
          onChange: handleProjectChange,
          selectedOption: selectedProject,
        }}
        storyOptions={{
          options: filterableStories,
          onChange: handleStoryChange,
          selectedOption: selectedStory,
        }}
        primaryAction={{
          label: "Filter",
          onClick: handleFilter,
        }}
        secondaryAction={{
          label: onNewLabel || "New",
          onClick: () => setStartDialogOpen(true),
        }}
        primarySessions={{
          ...primarySessions,
          onSelectSession: handleSelectPrimarySession,
        }}
        secondarySessions={
          secondarySessions && {
            ...secondarySessions,
            onSelectSession: handleSelectSecondarySession,
          }
        }
        rightChildren={children}
        headerText="Gherkin Editor"
        headerProjectKey={headerProjectKey}
        headerStoryKey={headerStoryKey}
        appBarTransparent
        basePath={basePath}
      />
      <SessionStartDialog
        open={startDialogOpen}
        onClose={() => setStartDialogOpen(false)}
        title={dialogLabel || "Create New Item"}
        connectionOptions={{
          options: connections,
          selectedOption: selectedConnection,
        }}
        projectOptions={{
          options: projects,
          selectedOption: selectedProject,
          loading: isProjectsLoading,
        }}
        storyOptions={{
          options: useNoStoryRunner ? stories : [USE_NO_STORY, ...stories],
          selectedOption: getDialogSelectedStoryOption(),
          loading: isStoriesLoading,
        }}
        onPrimarySubmit={primaryAction ? handlePrimarySubmit : undefined}
        primaryLabel={primaryActionLabel}
        onSecondarySubmit={secondaryAction ? handleSecondarySubmit : undefined}
        secondaryLabel={secondaryActionLabel}
      />
    </>
  );
};

export default PageLayout;
