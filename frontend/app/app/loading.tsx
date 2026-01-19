"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/utils/jwtUtils";
import { useUserConnectionsQuery } from "@/hooks/queries/useConnectionQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { CircularProgress } from "@mui/material";

const AppLoading: React.FC = () => {
  const {
    setSelectedConnection,
    selectedConnection,
    setConnections,
    connections,
  } = useWorkspaceStore();

  const { data: connectionsData } = useUserConnectionsQuery();

  const router = useRouter();

  // Update store when data changes
  useEffect(() => {
    setConnections(connectionsData?.data?.jira_connections || []);
  }, [connectionsData?.data?.jira_connections, setConnections]);

  // Initialize connection if none selected or invalid
  useEffect(() => {
    if (connections.length > 0 && !selectedConnection) {
      setSelectedConnection(connections[0]);
    }
  }, [connections, selectedConnection, setSelectedConnection]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return <CircularProgress />;
};

export default AppLoading;
