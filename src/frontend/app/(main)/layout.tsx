"use client";

import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { ConnectionNotFound } from "@/components/errors/ConnectionNotFound";
import AppLoading from "@/components/AppLoading";
import { connectionService } from "@/services/connectionService";

export default function ConnectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setConnection, setProjects } = useWorkspaceStore();
  const [isValidConnection, setIsValidConnection] = useState<boolean | null>(
    null,
  );

  const initialize = async () => {
    const connection = await connectionService.getConnectionDto();
    if (connection.data) {
      setConnection(connection.data);
      const projects = await connectionService.getProjects();
      if (projects.data) {
        setProjects(projects.data);
      }
      setIsValidConnection(true);
    } else {
      setIsValidConnection(false);
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  if (isValidConnection === null) {
    return <AppLoading />;
  }

  if (!isValidConnection) {
    return <ConnectionNotFound />;
  }

  return <>{children}</>;
}
