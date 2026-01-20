"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { ConnectionNotFound } from "@/components/errors/ConnectionNotFound";
import { useProjectDtosQuery } from "@/hooks/queries/useConnectionQueries";
import AppLoading from "../../loading";

export default function ConnectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const connectionIdOrName = useMemo(() => {
    return params?.connectionIdOrName as string;
  }, [params]);

  const { connections, setSelectedConnection, setProjects } =
    useWorkspaceStore();
  const [isValidConnection, setIsValidConnection] = useState<boolean | null>(
    null,
  );

  const matchedConnection = useMemo(() => {
    return connections.find(
      (c) => c.id === connectionIdOrName || c.name === connectionIdOrName,
    );
  }, [connections, connectionIdOrName]);

  useEffect(() => {
    if (matchedConnection) {
      setSelectedConnection(matchedConnection);
      setIsValidConnection(true);
    } else if (connections.length > 0) {
      // Only set to false if connections are loaded but no match found
      setIsValidConnection(false);
    }
  }, [matchedConnection, connections, setSelectedConnection]);

  // Fetch projects for the valid connection
  const { data: projectsData, isLoading: isProjectsLoading } =
    useProjectDtosQuery(matchedConnection?.id);

  useEffect(() => {
    if (projectsData?.data) {
      setProjects(projectsData.data);
    }
  }, [projectsData, setProjects]);

  if (isValidConnection === null) {
    return <AppLoading />;
  }

  if (!isValidConnection) {
    return <ConnectionNotFound />;
  }

  if (isProjectsLoading) {
    return <AppLoading />;
  }

  return <>{children}</>;
}
