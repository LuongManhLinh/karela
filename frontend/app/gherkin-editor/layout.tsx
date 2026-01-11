"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import type {
  JiraConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/integration";
import { getToken } from "@/utils/jwt_utils";
import {
  useUserConnectionsQuery,
  useProjectKeysQuery as useProjectDtosQuery,
  useStoryKeysQuery as useStorySummariesQuery,
} from "@/hooks/queries/useUserQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useACStore } from "@/store/useACStore";
import { SessionItem } from "@/components/SessionList";

interface GherkinEditorLayoutProps {
  children?: React.ReactNode;
}

const GherkinEditorLayout: React.FC<GherkinEditorLayoutProps> = ({
  children,
}) => {
  // Global State (Zustand)
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
  const selectedStorySummary =
    storySummaries.find((s) => s.key === selectedStoryKey) || null;

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

  const onConnectionChange = async (conn: JiraConnectionDto) => {
    setSelectedConnectionId(conn.id);
  };

  const handleProjectChange = (proj: ProjectDto | null) => {
    setSelectedProjectKey(proj ? proj.key : null);
  };

  const handleStoryChange = (story: StorySummary | null) => {
    setSelectedStoryKey(story ? story.key : null);
  };

  // Fetch ACs when story changes
  const { acs, fetchACs, createAC } = useACStore();

  useEffect(() => {
    if (selectedStoryKey && selectedStoryKey !== "None") {
      fetchACs(selectedStoryKey);
    }
  }, [selectedStoryKey, fetchACs]);

  const handleNewGherkin = async () => {
    if (selectedStoryKey && selectedStoryKey !== "None") {
      const newId = await createAC(
        selectedStoryKey,
        "Feature: New Feature\n  Scenario: New Scenario"
      );
      if (newId) {
        router.push(`/gherkin-editor/${newId}`);
      }
    } else {
      // Maybe show snackbar?
      alert("Please select a story first");
    }
  };

  const gherkinItems: SessionItem[] = useMemo(() => {
    return acs.map((ac) => ({
      id: ac.id,
      title: ac.content.split("\n")[0] || "Untitled", // First line as title
      subtitle: new Date(ac.updated_at || Date.now()).toLocaleString(),
    }));
  }, [acs]);

  const handleSelectGherkinItem = (id: string) => {
    // Set selected in store + navigate
    // selectAC(id) not strictly needed if page handles it, but good practice
    useACStore.getState().selectAC(id);
    router.push(`/gherkin-editor/${id}`);
  };

  return (
    <WorkspaceShell
      connections={connections}
      selectedConnection={selectedConnection}
      onConnectionChange={onConnectionChange}
      projectOptions={{
        options: projectDtos,
        onChange: handleProjectChange,
        selectedOption: selectedProjectDto,
      }}
      storyOptions={{
        options: storySummaries,
        onChange: handleStoryChange,
        selectedOption: selectedStorySummary,
      }}
      submitAction={{
        label: "New AC",
        onClick: handleNewGherkin,
        disabled: !selectedStorySummary || selectedStorySummary.key === "none",
      }}
      sessions={gherkinItems}
      selectedSessionId={null} // Placeholder
      onSelectSession={handleSelectGherkinItem}
      loadingSessions={false}
      loadingConnections={isConnectionsLoading}
      emptyStateText="No Acceptance Criteria found"
      sessionListLabel="Acceptance Criteria"
      rightChildren={children}
      headerText="Gherkin Editor"
      headerProjectKey={headerProjectKey}
      headerStoryKey={headerStoryKey}
      appBarTransparent
    />
  );
};

export default GherkinEditorLayout;
