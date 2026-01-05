"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import type { ChatSessionSummary } from "@/types/chat";
import type { JiraConnectionDto } from "@/types/integration";
import { SessionItem } from "@/components/SessionList";
import { getToken } from "@/utils/jwt_utils";
import {
  useUserConnectionsQuery,
  useProjectKeysQuery,
  useIssueKeysQuery,
} from "@/hooks/queries/useUserQueries";
import { useChatSessionsQuery } from "@/hooks/queries/useChatQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

interface ChatPageLayoutProps {
  children?: React.ReactNode;
}
const ChatPageLayout: React.FC<ChatPageLayoutProps> = ({ children }) => {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  // Global State (Zustand)
  const {
    selectedConnectionId,
    setSelectedConnectionId,
    selectedProjectKey,
    setSelectedProjectKey,
    selectedStoryKey,
    setSelectedStoryKey,
  } = useWorkspaceStore();

  const { data: connectionsData, isLoading: isConnectionsLoading } =
    useUserConnectionsQuery();

  // Find full connection object from ID
  const connections = connectionsData?.data?.jira_connections || [];
  const selectedConnection =
    connections.find((c) => c.id === selectedConnectionId) || null;

  const { data: projectKeysData } = useProjectKeysQuery(
    selectedConnectionId || undefined
  );
  const { data: sessionsData, isLoading: isSessionsLoading } =
    useChatSessionsQuery(selectedConnectionId || undefined);

  // Ensure projectKey is valid string for queries even if null in store
  const projectKey = selectedProjectKey || "";
  const { data: storyKeysData } = useIssueKeysQuery(
    selectedConnectionId || undefined,
    projectKey
  );

  const projectKeys = projectKeysData?.data || [];
  const storyKeys = storyKeysData?.data ? ["None", ...storyKeysData.data] : [];
  const storyKey = selectedStoryKey || "None"; // UI uses "None" string usage in some places logic?

  const [headerProjectKey, setHeaderProjectKey] = useState<string>("");
  const [headerStoryKey, setHeaderStoryKey] = useState<string>("");

  const router = useRouter();

  // Initialize connection if none selected or invalid
  useEffect(() => {
    if (connections.length > 0) {
      if (
        !selectedConnectionId ||
        !connections.find((c) => c.id === selectedConnectionId)
      ) {
        setSelectedConnectionId(connections[0].id);
      }
    }
  }, [connections, selectedConnectionId, setSelectedConnectionId]);

  // Initialize project key
  useEffect(() => {
    // If we have keys but no selection (or selection invalid), select first
    if (projectKeys.length > 0) {
      if (!selectedProjectKey || !projectKeys.includes(selectedProjectKey)) {
        setSelectedProjectKey(projectKeys[0]);
      }
    } else if (projectKeys.length === 0 && selectedProjectKey) {
      // Clear selection if no keys
      setSelectedProjectKey(null);
    }
  }, [projectKeys, selectedProjectKey, setSelectedProjectKey]);

  // Initialize sessions
  useEffect(() => {
    if (sessionsData?.data) {
      setSessions(sessionsData.data);
    }
  }, [sessionsData]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const onConnectionChange = async (conn: JiraConnectionDto) => {
    setSelectedConnectionId(conn.id);
  };

  const onProjectKeyChange = (projKey: string) => {
    setSelectedProjectKey(projKey);
  };

  const onStoryKeyChange = (sKey: string) => {
    setSelectedStoryKey(sKey === "None" ? null : sKey);
  };

  // Sessions loading handled by query

  const handleSelectSession = async (sessionId: string) => {
    console.log("Selecting session:", sessionId);
    setSelectedSessionId(sessionId);
    router.push(`/chat/${sessionId}`);
  };

  const handleNewChat = () => {
    setHeaderProjectKey(selectedProjectKey || "");
    setHeaderStoryKey(selectedStoryKey || "");
    setSelectedSessionId(null);
    router.push(`/chat/`);
  };

  const sessionItems = useMemo<SessionItem[]>(() => {
    const items: SessionItem[] = [];
    sessions.forEach((session) => {
      items.push({
        id: session.id,
        title: session.key,
        subtitle: new Date(session.created_at).toLocaleString(),
      });
      if (session.id === selectedSessionId) {
        setHeaderProjectKey(session.project_key);
        setHeaderStoryKey(session.story_key || "");
      }
    });
    return items;
  }, [sessions]);

  return (
    <WorkspaceShell
      connections={connections}
      selectedConnection={selectedConnection}
      onConnectionChange={onConnectionChange}
      projectOptions={{
        options: projectKeys,
        onChange: onProjectKeyChange,
        selectedOption: projectKey,
      }}
      storyOptions={{
        options: storyKeys,
        onChange: onStoryKeyChange,
        selectedOption: storyKey,
      }}
      submitAction={{
        label: "New Chat",
        onClick: handleNewChat,
      }}
      sessions={sessionItems}
      selectedSessionId={selectedSessionId}
      onSelectSession={handleSelectSession}
      loadingSessions={isSessionsLoading}
      loadingConnections={isConnectionsLoading}
      emptyStateText="No chat sessions found"
      sessionListLabel="Chat Sessions"
      rightChildren={children}
      headerText="Chat"
      headerProjectKey={headerProjectKey}
      headerStoryKey={headerStoryKey}
      appBarTransparent
    />
  );
};

export default ChatPageLayout;
