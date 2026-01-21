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
  const connectionName = useMemo(() => {
    return params?.connectionName as string;
  }, [params]);

  const { setProjects } = useWorkspaceStore();
  const [isValidConnection, setIsValidConnection] = useState<boolean | null>(
    null,
  );

  // Fetch projects for the valid connection
  const { data: projectsData, isLoading: isProjectsLoading } =
    useProjectDtosQuery(connectionName);

  useEffect(() => {
    const projects = projectsData?.data;
    if (projects === null || projects === undefined) {
      setIsValidConnection(false);
    } else {
      setIsValidConnection(true);
      setProjects(projects);
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
