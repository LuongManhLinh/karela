"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import PageLayout from "@/components/PageLayout";
import { SessionItem } from "@/components/SessionList";
import { useStorySummariesQuery } from "@/hooks/queries/useConnectionQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import type { StorySummary } from "@/types/connection";

interface WorkspaceLayoutProps {
  children?: React.ReactNode;
  connectionName: string;
  projectKey: string;
  storyKey?: string;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  children,
  connectionName,
  projectKey,
  storyKey,
}) => {
  const t = useTranslations("workspace.WorkspaceLayout");
  const router = useRouter();
  const {
    setHeaderProjectKey,
    setHeaderStoryKey,
    setSelectedStory,
    stories,
    setStories,
  } = useWorkspaceStore();

  const [selectedStoryKey, setSelectedStoryKey] = useState<string | null>(
    storyKey || null,
  );

  // Fetch story summaries for the project
  const { data: storiesData, isLoading: isStoriesLoading } =
    useStorySummariesQuery(connectionName, projectKey);

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
  };

  // Convert stories to session items for the sidebar
  const sessionItems = useMemo<SessionItem[]>(() => {
    return storySummaries.map((story) => ({
      id: story.key,
      title: story.key,
      subtitle: story.summary || undefined,
    }));
  }, [storySummaries]);

  const basePath = `/app/connections/${connectionName}/projects/${projectKey}`;

  return (
    <PageLayout
      level="project"
      connectionName={connectionName}
      projectKey={projectKey}
      href="workspace"
      headerText={t("headerText")}
      primarySessions={{
        sessions: sessionItems,
        loading: isStoriesLoading,
        selectedSessionId: selectedStoryKey,
        onSelectSession: handleSelectStory,
        label: t("stories"),
        emptyStateText: t("noStoriesYet"),
      }}
      disablePrimaryAutoRoute={false}
      createable={false}
    >
      {children}
    </PageLayout>
  );
};

export default WorkspaceLayout;
