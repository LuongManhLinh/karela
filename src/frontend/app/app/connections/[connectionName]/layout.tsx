"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { ConnectionNotFound } from "@/components/errors/ConnectionNotFound";
import { useProjectDtosQuery } from "@/hooks/queries/useConnectionQueries";
import AppLoading from "../../loading";
import { Typography } from "@mui/material";

export default function ConnectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const connectionName = useMemo(() => {
    return params?.connectionName as string;
  }, [params]);

  const { setProjects, setSelectedProject } = useWorkspaceStore();
  const [isValidConnection, setIsValidConnection] = useState<boolean | null>(
    null,
  );
  const [isProjectsEmpty, setIsProjectsEmpty] = useState<boolean>(false);

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
      if (projects.length === 0) {
        setIsProjectsEmpty(true);
      } else {
        setIsProjectsEmpty(false);
        // Don't auto-select the first project - let the user select it
      }
    }
  }, [projectsData, setProjects]);

  if (isValidConnection === null) {
    return <AppLoading />;
  }

  if (!isValidConnection) {
    return <ConnectionNotFound />;
  }
  if (isProjectsEmpty) {
    return (
      <Typography variant="h6" align="center" mt={4}>
        No projects found for this connection. Please create at least one
        project to proceed.
      </Typography>
    );
  }

  if (isProjectsLoading) {
    return <AppLoading />;
  }

  return <>{children}</>;
}
