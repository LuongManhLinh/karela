"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { ProjectNotFound } from "@/components/errors/ProjectNotFound";
import { useStorySummariesQuery } from "@/hooks/queries/useConnectionQueries";
import AppLoading from "../../../../loading";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const { connectionName, projectKey } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
    };
  }, [params]);

  const { projects, setUrlSelectedProject, setUrlSelectedStory, setStories } =
    useWorkspaceStore();
  const [isValidProject, setIsValidProject] = useState<boolean | null>(null);

  // Fetch stories for the valid project
  const { data: storiesData, isLoading: isStoriesLoading } =
    useStorySummariesQuery(connectionName, projectKey);

  useEffect(() => {
    const stories = storiesData?.data;
    const project = projects.find((proj) => proj.key === projectKey);
    if (!project || stories === null || stories === undefined) {
      setIsValidProject(false);
    } else {
      setIsValidProject(true);
      setUrlSelectedProject(project);
      setUrlSelectedStory(null);
      setStories(stories);
    }
  }, [
    storiesData,
    projectKey,
    projects,
    setUrlSelectedProject,
    setStories,
    setUrlSelectedStory,
  ]);

  if (isValidProject === null) {
    return <AppLoading />;
  }

  if (!isValidProject) {
    return <ProjectNotFound />;
  }

  if (isStoriesLoading) {
    return <AppLoading />;
  }

  return <>{children}</>;
}
