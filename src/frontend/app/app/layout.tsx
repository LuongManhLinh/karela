"use client";

import React, { useEffect } from "react";
import { useUserConnectionsQuery } from "@/hooks/queries/useConnectionQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useRouter } from "next/navigation";
import { getToken } from "@/utils/jwtUtils";
import AppLoading from "./loading";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { setConnections: setConnections } = useWorkspaceStore();
  const { data: connectionsData, isLoading: isConnectionsLoading } =
    useUserConnectionsQuery();
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const connections = connectionsData?.data || [];
    if (connections.length > 0) {
      setConnections(connections);
    } else if (!isConnectionsLoading) {
      router.push("/profile");
    }
  }, [connectionsData, setConnections, isConnectionsLoading]);

  if (isConnectionsLoading) {
    return <AppLoading />;
  }

  return <>{children}</>;
}
