"use client";

import React, { useState, useMemo } from "react";
import type {
  ConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/connection";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { SessionItem } from "@/components/SessionList";
import {
  useACsByProjectQuery,
  useACsByStoryQuery,
} from "@/hooks/queries/useACQueries";
import { connectionService } from "@/services/connectionService";
import PageLayout from "../PageLayout";

interface AcEditorLayoutProps {
  children?: React.ReactNode;
  level: "project" | "story";
}

const AcEditorLayout: React.FC<AcEditorLayoutProps> = ({ children, level }) => {
  const [selectedACId, setSelectedACId] = useState<string | null>(null);

  const { selectedConnection, selectedProject, selectedStory } =
    useWorkspaceStore();

  const { data: acsData, isLoading: isACsLoading } =
    level === "project"
      ? useACsByProjectQuery(selectedConnection?.id, selectedProject?.key)
      : useACsByStoryQuery(
          selectedConnection?.id,
          selectedProject?.key,
          selectedStory?.key,
        );

  const acs = acsData?.data || [];

  const handleSelectGherkinItem = (id: string) => {
    setSelectedACId(id);
  };

  const handleNewGherkin = async (
    connection: ConnectionDto,
    project: ProjectDto,
    story: StorySummary,
  ) => {
    const newId = await connectionService.createAC(
      connection.id,
      project.key,
      story.key,
      false,
    );
    return newId?.data || null;
  };

  const handleNewGherkinWithAI = async (
    connection: ConnectionDto,
    project: ProjectDto,
    story: StorySummary,
  ) => {
    const newId = await connectionService.createAC(
      connection.id,
      project.key,
      story.key,
      true,
    );
    return newId?.data || null;
  };

  const gherkinItems: SessionItem[] = useMemo(() => {
    return acs.map((ac) => ({
      id: ac.id,
      title: ac.summary,
      subtitle: new Date(ac.updated_at || Date.now()).toLocaleString(),
    }));
  }, [acs]);

  return (
    <PageLayout
      level={level}
      href="acs"
      primarySessions={{
        sessions: gherkinItems,
        selectedSessionId: selectedACId,
        onSelectSession: handleSelectGherkinItem,
        loading: isACsLoading,
        emptyStateText:
          "No Acceptance Criteria found" +
          (selectedStory ? ` for story ${selectedStory.key}` : ""),
        label: "Acceptance Criteria",
      }}
      onNewLabel="New Gherkin"
      dialogLabel="Create Acceptance Criteria"
      primaryAction={handleNewGherkin}
      primaryActionLabel="Create"
      secondaryAction={handleNewGherkinWithAI}
      secondaryActionLabel="Generate with AI"
      useNoStoryFilter
    >
      {children}
    </PageLayout>
  );
};

export default AcEditorLayout;
