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
  const projectIdOrKey = useMemo(() => {
    return params?.projectIdOrKey as string;
  }, [params]);

  const { projects, setSelectedProject, setStories, selectedConnection } =
    useWorkspaceStore();
  const [isValidProject, setIsValidProject] = useState<boolean | null>(null);

  const matchedProject = useMemo(() => {
    return projects.find(
      (p) => p.id === projectIdOrKey || p.key === projectIdOrKey,
    );
  }, [projects, projectIdOrKey]);

  useEffect(() => {
    if (matchedProject) {
      setSelectedProject(matchedProject);
      setIsValidProject(true);
    } else if (projects.length > 0) {
      // Only set to false if projects are loaded but no match found
      // Note: projects are loaded in the parent ConnectionLayout
      setIsValidProject(false);
    }
  }, [matchedProject, projects, setSelectedProject]);

  // Fetch stories for the valid project
  const { data: storiesData, isLoading: isStoriesLoading } =
    useStorySummariesQuery(selectedConnection?.id, matchedProject?.key);

  useEffect(() => {
    if (storiesData?.data) {
      setStories(storiesData.data);
    }
  }, [storiesData, setStories]);

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
