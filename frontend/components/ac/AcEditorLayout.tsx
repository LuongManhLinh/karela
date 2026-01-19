"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import type {
  ConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/connection";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { SessionItem } from "@/components/SessionList";
import { NO_STORY_FILTER } from "@/constants/selectable";
import {
  useACsByProjectQuery,
  useACsByStoryQuery,
} from "@/hooks/queries/useACQueries";
import { connectionService } from "@/services/connectionService";
import { SessionStartDialog } from "@/components/SessionStartDialog";

interface AcEditorLayoutProps {
  children?: React.ReactNode;
  level: "project" | "story";
}

const AcEditorLayout: React.FC<AcEditorLayoutProps> = ({ children, level }) => {
  const [selectedACId, setSelectedACId] = useState<string | null>(null);
  const [startDialogOpen, setStartDialogOpen] = useState(false);

  const {
    connections,
    projects,
    stories,
    selectedConnection,
    setSelectedConnection,
    selectedProject,
    setSelectedProject,
    selectedStory,
    setSelectedStory,
    headerProjectKey,
    headerStoryKey,
  } = useWorkspaceStore();

  const filterableStories =
    stories.length > 0 ? [NO_STORY_FILTER, ...stories] : [];

  const { data: acsData, isLoading: isACsLoading } =
    level === "project"
      ? useACsByProjectQuery(selectedConnection?.id, selectedProject?.key)
      : useACsByStoryQuery(
          selectedConnection?.id,
          selectedProject?.key,
          selectedStory?.key,
        );

  const basePath = useMemo(
    () =>
      level === "project"
        ? `/app/connections/${selectedConnection?.name}/projects/${selectedProject?.key}`
        : `/app/connections/${selectedConnection?.name}/projects/${selectedProject?.key}/stories/${selectedStory?.key}`,
    [level, selectedConnection, selectedProject, selectedStory],
  );

  const acs = acsData?.data || [];

  const router = useRouter();

  const handleConnectionChange = async (conn: ConnectionDto | null) => {
    setSelectedConnection(conn || null);
    setSelectedProject(null);
    setSelectedStory(null);
  };

  const handleProjectChange = (proj: ProjectDto | null) => {
    setSelectedProject(proj);
    setSelectedStory(null);
  };

  const handleStoryChange = (story: StorySummary | null) => {
    setSelectedStory(story);
  };

  const handleFilter = () => {
    if (selectedConnection && selectedProject) {
      if (selectedStory && selectedStory.id !== NO_STORY_FILTER.id) {
        router.push(
          `/app/connections/${selectedConnection.id}/projects/${selectedProject.key}/stories/${selectedStory.key}/acs`,
        );
      } else {
        router.push(
          `/app/connections/${selectedConnection.id}/projects/${selectedProject.key}/acs`,
        );
      }
    }
  };

  const handleNewGherkin = async (
    connection: ConnectionDto,
    project: ProjectDto,
    story: StorySummary,
    aiGenerate: boolean,
  ) => {
    const newId = await connectionService.createAC(
      connection.id,
      project.key,
      story.key,
      aiGenerate,
    );
    if (newId) {
      setSelectedACId(newId.data);
      setSelectedConnection(connection);
      setSelectedProject(project);
      setSelectedStory(story);
      setStartDialogOpen(false);
      router.push(`${basePath}/acs/${newId.data}`);
    }
  };

  const gherkinItems: SessionItem[] = useMemo(() => {
    return acs.map((ac) => ({
      id: ac.id,
      title: ac.summary,
      subtitle: new Date(ac.updated_at || Date.now()).toLocaleString(),
    }));
  }, [acs]);

  const handleSelectGherkinItem = (id: string) => {
    setSelectedACId(id);
    router.push(`${basePath}/${id}`);
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
          label: "New Gherkin",
          onClick: () => setStartDialogOpen(true),
        }}
        sessions={gherkinItems}
        selectedSessionId={selectedACId}
        onSelectSession={handleSelectGherkinItem}
        loadingSessions={isACsLoading}
        emptyStateText={
          "No Acceptance Criteria found" +
          (selectedStory ? ` for story ${selectedStory.key}` : "")
        }
        sessionListLabel="Acceptance Criteria"
        rightChildren={children}
        headerText="Gherkin Editor"
        headerProjectKey={headerProjectKey}
        headerStoryKey={headerStoryKey}
        appBarTransparent
        basePath={`/app/connections/${selectedConnection?.name}/projects/${selectedProject?.key}`}
      />
      <SessionStartDialog
        open={startDialogOpen}
        onClose={() => setStartDialogOpen(false)}
        title="Create Acceptance Criteria"
        connectionOptions={{
          options: connections,
          selectedOption: selectedConnection,
        }}
        projectOptions={{
          options: projects,
          selectedOption: selectedProject,
        }}
        storyOptions={{
          options: stories,
          selectedOption:
            selectedStory?.id === NO_STORY_FILTER.id ? null : selectedStory,
        }}
        onPrimarySubmit={(conn, proj, story) =>
          handleNewGherkin(conn, proj, story, false)
        }
        primaryLabel="Create"
        onSecondarySubmit={(conn, proj, story) =>
          handleNewGherkin(conn, proj, story, true)
        }
        secondaryLabel="Generate with AI"
      />
    </>
  );
};

export default AcEditorLayout;
