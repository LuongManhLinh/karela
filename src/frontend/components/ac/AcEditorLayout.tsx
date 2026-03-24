"use client";

import React, { useState, useMemo } from "react";
import type { ProjectDto, StorySummary } from "@/types/connection";
import { SessionItem } from "@/components/SessionList";
import {
  useACsByConnectionQuery,
  useACsByProjectQuery,
  useACsByStoryQuery,
} from "@/hooks/queries/useACQueries";
import PageLayout from "../PageLayout";
import { acService } from "@/services/acService";
import { useTranslations } from "next-intl";
import { PageLevel } from "@/types";

interface AcEditorLayoutProps {
  children?: React.ReactNode;
  level: PageLevel;
  projectKey?: string; // Required if level is "project" or "story"
  storyKey?: string; // Required if level is "story"
  idOrKey?: string;
}

const AcEditorLayout: React.FC<AcEditorLayoutProps> = ({
  children,
  level,
  projectKey,
  storyKey,
  idOrKey,
}) => {
  const [selectedACId, setSelectedACId] = useState<string | null>(
    idOrKey || null,
  );

  const getDataQuery = () => {
    switch (level) {
      case "connection":
        return useACsByConnectionQuery();
      case "project":
        return useACsByProjectQuery(projectKey!);
      case "story":
        return useACsByStoryQuery(projectKey!, storyKey!);
    }
  };

  const {
    data: acsData,
    isLoading: isACsLoading,
    refetch: refetchACs,
  } = getDataQuery();

  const acs = useMemo(() => acsData?.data || [], [acsData]);

  const t = useTranslations("ac.AcEditorLayout");

  const handleSelectGherkinItem = (id: string) => {
    setSelectedACId(id);
  };

  const handleNewGherkin = async (
    project: ProjectDto,
    story?: StorySummary,
  ) => {
    if (!story) {
      return null;
    }
    const newId = await acService.createAC(project.key, story.key, false);
    await refetchACs();
    return newId?.data || null;
  };

  const handleNewGherkinWithAI = async (
    project: ProjectDto,
    story?: StorySummary,
  ) => {
    if (!story) {
      return null;
    }
    const newId = await acService.createAC(project.key, story.key, true);
    await refetchACs();
    return newId?.data || null;
  };

  const gherkinItems: SessionItem[] = useMemo(() => {
    return acs.map((ac) => ({
      id: ac.key || ac.id,
      title: ac.summary,
      projectKey: ac.project_key,
      storyKey: ac.story_key,
      subtitle: new Date(ac.updated_at || Date.now()).toLocaleString(),
    }));
  }, [acs]);

  return (
    <PageLayout
      level={level}
      headerText={t("headerText")}
      projectKey={projectKey}
      storyKey={storyKey}
      href="acs"
      primarySessions={{
        sessions: gherkinItems,
        selectedSessionId: selectedACId,
        onSelectSession: handleSelectGherkinItem,
        loading: isACsLoading,
        emptyStateText:
          t("noAcceptanceCriteriaFound") +
          (storyKey ? ` ${t("forStory")} ${storyKey}` : ""),
        label: t("acceptanceCriteria"),
      }}
      onNewLabel={t("newGherkin")}
      dialogLabel={t("createAcceptanceCriteria")}
      primaryAction={handleNewGherkin}
      primaryActionLabel={t("create")}
      secondaryAction={handleNewGherkinWithAI}
      secondaryActionLabel={t("generateWithAI")}
      showStoryCheckbox={false}
      requireStory={true}
    >
      {children}
    </PageLayout>
  );
};

export default AcEditorLayout;
