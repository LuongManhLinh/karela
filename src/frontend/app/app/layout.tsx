"use client";

import React, { useEffect } from "react";
import { useUserConnectionsQuery } from "@/hooks/queries/useConnectionQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useParams, useRouter } from "next/navigation";
import { getToken } from "@/utils/jwtUtils";
import AppLoading from "./loading";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    setConnections,
    setUrlSelectedConnection,
    setUrlSelectedProject,
    setUrlSelectedStory,
    connections,
    projects,
    stories,
  } = useWorkspaceStore();

  const { data: connectionsData, isLoading: isConnectionsLoading } =
    useUserConnectionsQuery();

  const params = useParams();

  const { connectionName, projectKey, storyKey } = React.useMemo(() => {
    return {
      connectionName: params?.connectionName as string | undefined,
      projectKey: params?.projectKey as string | undefined,
      storyKey: params?.storyKey as string | undefined,
    };
  }, [params]);

  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    setUrlSelectedConnection(null);
    console.log("Set null urlSelectedConnection in AppLayout useEffect");
    const connections = connectionsData?.data || [];
    if (connections.length > 0) {
      setConnections(connections);
    } else if (!isConnectionsLoading) {
      router.push("/profile");
    }
  }, [
    connectionsData,
    setConnections,
    setUrlSelectedConnection,
    isConnectionsLoading,
  ]);

  useEffect(() => {
    if (connectionName) {
      const connection = connections.find(
        (conn) => conn.name === connectionName,
      );
      if (connection) {
        setUrlSelectedConnection(connection);
      }
    }
  }, [connectionName, connections]);

  useEffect(() => {
    if (projectKey) {
      const project = projects.find((proj) => proj.key === projectKey);
      if (project) {
        setUrlSelectedProject(project);
      }
    }
  }, [projectKey, projects]);

  useEffect(() => {
    if (storyKey) {
      const story = stories.find((s) => s.key === storyKey);
      if (story) {
        setUrlSelectedStory(story);
      }
    }
  }, [storyKey, stories]);

  if (isConnectionsLoading) {
    return <AppLoading />;
  }

  return <>{children}</>;
}
