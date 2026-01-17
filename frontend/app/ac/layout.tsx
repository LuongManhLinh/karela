"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import type {
  JiraConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/integration";
import { getToken } from "@/utils/jwtUtils";
import {
  useUserConnectionsQuery,
  useProjectKeysQuery as useProjectDtosQuery,
  useStoryKeysQuery as useStorySummariesQuery,
} from "@/hooks/queries/useUserQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { SessionItem } from "@/components/SessionList";
import { NO_FILTER_STORY_SUMMARY } from "@/constants/selectable";
import { useACsQuery } from "@/hooks/queries/useACQueries";
import { connectionService } from "@/services/connectionService";
import { SessionStartDialog } from "@/components/SessionStartDialog";

interface GherkinEditorLayoutProps {
  children?: React.ReactNode;
}

const GherkinEditorLayout: React.FC<GherkinEditorLayoutProps> = ({
  children,
}) => {
  const [selectedACId, setSelectedACId] = useState<string | null>(null);
  const [startDialogOpen, setStartDialogOpen] = useState(false);

  const {
    selectedConnectionId,
    setSelectedConnectionId,
    selectedProjectKey,
    setSelectedProjectKey,
    selectedStoryKey,
    setSelectedStoryKey,
    headerProjectKey,
    setHeaderProjectKey,
    headerStoryKey,
    setHeaderStoryKey,
  } = useWorkspaceStore();

  const { data: connectionsData, isLoading: isConnectionsLoading } =
    useUserConnectionsQuery();
  // Find full connection object from ID
  const connections = connectionsData?.data?.jira_connections || [];
  const selectedConnection =
    connections.find((c) => c.id === selectedConnectionId) || null;

  const { data: projectDtosData } = useProjectDtosQuery(
    selectedConnectionId || undefined
  );
  const projectDtos = projectDtosData?.data || [];
  const selectedProjectDto =
    projectDtos.find((p) => p.key === selectedProjectKey) || null;

  const { data: storySummariesData } = useStorySummariesQuery(
    selectedConnectionId || undefined,
    selectedProjectDto?.key || undefined
  );
  const storySummaries = storySummariesData?.data
    ? storySummariesData.data
    : [];
  const filteringStorySummaries =
    storySummaries.length > 0
      ? [NO_FILTER_STORY_SUMMARY, ...storySummaries]
      : [];
  const selectedStorySummary =
    filteringStorySummaries.find((s) => s.key === selectedStoryKey) ||
    NO_FILTER_STORY_SUMMARY;

  const { data: acsData, isLoading: isACsLoading } = useACsQuery(
    selectedConnectionId || undefined,
    selectedProjectDto?.key || undefined,
    selectedStorySummary?.key || undefined
  );

  const acs = acsData?.data || [];

  const router = useRouter();

  // Initialize connection if none selected or invalid
  useEffect(() => {
    if (connections.length > 0) {
      if (
        !selectedConnectionId ||
        !connections.find((c) => c.id === selectedConnectionId)
      ) {
        setSelectedConnectionId(connections[0].id);
      }
    }
  }, [connections, selectedConnectionId, setSelectedConnectionId]);

  // Initialize project key
  useEffect(() => {
    if (projectDtos.length > 0) {
      if (
        !selectedProjectKey ||
        !projectDtos.find((p) => p.key === selectedProjectKey)
      ) {
        setSelectedProjectKey(projectDtos[0].key);
      }
    } else if (projectDtos.length === 0 && selectedProjectKey) {
      setSelectedProjectKey(null);
    }
  }, [projectDtos, selectedProjectKey, setSelectedProjectKey]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleConnectionChange = async (conn: JiraConnectionDto | null) => {
    setSelectedConnectionId(conn?.id || null);
    setSelectedProjectKey(null);
    setSelectedStoryKey(null);
    setSelectedACId(null);
    router.push("/ac");
  };

  const handleProjectChange = (proj: ProjectDto | null) => {
    setSelectedProjectKey(proj ? proj.key : null);
    setSelectedStoryKey(null);
    setSelectedACId(null);
    router.push("/ac");
  };

  const handleStoryChange = (story: StorySummary | null) => {
    setSelectedStoryKey(story ? story.key : null);
    setSelectedACId(null);
    router.push("/ac");
  };

  const handleNewGherkin = async (
    connectionId: string,
    projectKey: string,
    storyKey: string
  ) => {
    const newId = await connectionService.createAC(
      connectionId,
      projectKey,
      storyKey,
      false
    );
    if (newId) {
      setSelectedACId(newId.data);
      setSelectedConnectionId(connectionId);
      setSelectedProjectKey(projectKey);
      setSelectedStoryKey(storyKey);
      setStartDialogOpen(false);
      router.push(`/ac/${newId.data}`);
    }
  };

  const handleAIGenerate = async (
    connectionId: string,
    projectKey: string,
    storyKey: string
  ) => {
    console.log("Creating with storyKey:", storyKey);
    const newId = await connectionService.createAC(
      connectionId,
      projectKey,
      storyKey,
      true
    );
    if (newId) {
      setSelectedACId(newId.data);
      setSelectedConnectionId(connectionId);
      setSelectedProjectKey(projectKey);
      setSelectedStoryKey(storyKey);
      setStartDialogOpen(false);
      router.push(`/ac/${newId.data}`);
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
    const ac = acs.find((a) => a.id === id);
    if (ac) {
      setSelectedConnectionId(selectedConnectionId);
      setSelectedProjectKey(selectedProjectDto?.key || null);
      setSelectedStoryKey(ac.story_key);
      router.push(`/ac/${id}`);
    }
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
          options: projectDtos,
          onChange: handleProjectChange,
          selectedOption: selectedProjectDto,
        }}
        storyOptions={{
          options: filteringStorySummaries,
          onChange: handleStoryChange,
          selectedOption: selectedStorySummary,
        }}
        submitAction={{
          label: "New AC",
          onClick: () => setStartDialogOpen(true),
        }}
        sessions={gherkinItems}
        selectedSessionId={selectedACId}
        onSelectSession={handleSelectGherkinItem}
        loadingSessions={isACsLoading}
        loadingConnections={isConnectionsLoading}
        emptyStateText={
          "No Acceptance Criteria found" +
          (selectedStorySummary ? ` for story ${selectedStorySummary.key}` : "")
        }
        sessionListLabel="Acceptance Criteria"
        rightChildren={children}
        headerText="Gherkin Editor"
        headerProjectKey={headerProjectKey}
        headerStoryKey={headerStoryKey}
        appBarTransparent
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
          options: projectDtos,
          selectedOption: selectedProjectDto,
        }}
        storyOptions={{
          options: storySummaries,
          selectedOption:
            selectedStorySummary.id === "ALL" ? null : selectedStorySummary,
        }}
        onPrimarySubmit={handleNewGherkin}
        primaryLabel="Create"
        onSecondarySubmit={handleAIGenerate}
        secondaryLabel="Generate with AI"
      />
    </>
  );
};

export default GherkinEditorLayout;
