"use client";

import React, { useState, useMemo } from "react";
import type {
  ConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/connection";
import { SessionItem } from "@/components/SessionList";
import {
  useACsByProjectQuery,
  useACsByStoryQuery,
} from "@/hooks/queries/useACQueries";
import { connectionService } from "@/services/connectionService";
import PageLayout from "../PageLayout";
import { acService } from "@/services/acService";

interface AcEditorLayoutProps {
  children?: React.ReactNode;
  level: "project" | "story";
  connectionName: string;
  projectKey: string;
  storyKey?: string; // Required if level is "story"
}

const AcEditorLayout: React.FC<AcEditorLayoutProps> = ({
  children,
  level,
  connectionName,
  projectKey,
  storyKey,
}) => {
  const [selectedACId, setSelectedACId] = useState<string | null>(null);

  const {
    data: acsData,
    isLoading: isACsLoading,
    refetch: refetchACs,
  } = level === "project"
    ? useACsByProjectQuery(connectionName, projectKey)
    : useACsByStoryQuery(connectionName, projectKey, storyKey!);

  const acs = useMemo(() => acsData?.data || [], [acsData]);

  const handleSelectGherkinItem = (id: string) => {
    setSelectedACId(id);
  };

  const handleNewGherkin = async (
    connection: ConnectionDto,
    project: ProjectDto,
    story: StorySummary,
  ) => {
    const newId = await acService.createAC(
      connection.id,
      project.key,
      story.key,
      false,
    );
    await refetchACs();
    return newId?.data || null;
  };

  const handleNewGherkinWithAI = async (
    connection: ConnectionDto,
    project: ProjectDto,
    story: StorySummary,
  ) => {
    const newId = await acService.createAC(
      connection.id,
      project.key,
      story.key,
      true,
    );
    await refetchACs();
    return newId?.data || null;
  };

  const gherkinItems: SessionItem[] = useMemo(() => {
    return acs.map((ac) => ({
      id: ac.key || ac.id,
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
          (storyKey ? ` for story ${storyKey}` : ""),
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
