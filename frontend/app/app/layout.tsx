"use client";

import React, { useEffect } from "react";
import { useUserConnectionsQuery } from "@/hooks/queries/useConnectionQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useRouter } from "next/navigation";
import { getToken } from "@/utils/jwtUtils";
import AppLoading from "./loading";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setConnections } = useWorkspaceStore();
  const { data: connectionsData, isLoading } = useUserConnectionsQuery();
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (connectionsData?.data?.jira_connections) {
      setConnections(connectionsData.data.jira_connections);
    }
  }, [connectionsData, setConnections]);

  if (isLoading) {
    return <AppLoading />;
  }

  return <>{children}</>;
}
