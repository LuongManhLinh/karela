"use client";

import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { ConnectionNotFound } from "@/components/errors/ConnectionNotFound";
import AppLoading from "@/components/AppLoading";
import {
  useConnectionQuery,
  useProjectDtosQuery,
} from "@/hooks/queries/useConnectionQueries";

export default function ConnectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setConnection, setProjects } = useWorkspaceStore();
  const [isValidConnection, setIsValidConnection] = useState<boolean | null>(
    null,
  );

  const { data: connectionData, isLoading: isConnectionLoading } =
    useConnectionQuery();
  const { data: projectsData, isLoading: isProjectsLoading } =
    useProjectDtosQuery();

  const connection = connectionData?.data;
  const projects = projectsData?.data || [];

  useEffect(() => {
    if (!isConnectionLoading) {
      if (connection) {
        setConnection(connection);
        setIsValidConnection(true);
      } else {
        setIsValidConnection(false);
      }
    }
  }, [isConnectionLoading, connection, setConnection]);

  useEffect(() => {
    if (!isProjectsLoading) {
      setProjects(projects);
    }
  }, [isProjectsLoading, projects, setProjects]);

  if (isValidConnection === null) {
    return <AppLoading />;
  }

  if (!isValidConnection) {
    return <ConnectionNotFound />;
  }

  return <>{children}</>;
}
