"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import type { ChatSessionSummary } from "@/types/chat";
import type {
  JiraConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/integration";
import { SessionItem } from "@/components/SessionList";
import { getToken } from "@/utils/jwtUtils";
import {
  useUserConnectionsQuery,
  useProjectKeysQuery,
  useStoryKeysQuery,
} from "@/hooks/queries/useUserQueries";
import { useChatSessionsQuery } from "@/hooks/queries/useChatQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { NONE_STORY_SUMMARY } from "@/constants/selectable";

interface ChatPageLayoutProps {
  children?: React.ReactNode;
}
const ChatPageLayout: React.FC<ChatPageLayoutProps> = ({ children }) => {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [selectedSessionKey, setSelectedSessionKey] = useState<string | null>(
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
    headerProjectKey,
    setHeaderProjectKey,
    headerStoryKey,
    setHeaderStoryKey,
  } = useWorkspaceStore();

  const { data: connectionsData, isLoading: isConnectionsLoading } =
    useUserConnectionsQuery();

  // Find full connection object from ID
  const connections = connectionsData?.data?.jira_connections || [];
  const selectedConnection =
    connections.find((c) => c.id === selectedConnectionId) || null;

  const { data: projectDtosData } = useProjectKeysQuery(
    selectedConnectionId || undefined
  );
  const projectDtos = projectDtosData?.data || [];
  const selectedProjectDto =
    projectDtos.find((p) => p.key === selectedProjectKey) || null;

  const { data: sessionsData, isLoading: isSessionsLoading } =
    useChatSessionsQuery(selectedConnectionId || undefined);

  // Ensure projectKey is valid string for queries even if null in store
  const { data: storyKeysData } = useStoryKeysQuery(
    selectedConnectionId || undefined,
    selectedProjectDto?.key || undefined
  );

  const storySummaries = storyKeysData?.data
    ? [NONE_STORY_SUMMARY, ...storyKeysData.data]
    : [];
  const selectedStorySummary =
    storySummaries.find((s) => s.key === selectedStoryKey) ||
    NONE_STORY_SUMMARY;

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
    if (projectDtos.length > 0) {
      if (
        !selectedProjectKey ||
        !projectDtos.find((p) => p.key === selectedProjectKey)
      ) {
        setSelectedProjectKey(projectDtos[0].key);
      }
    } else if (projectDtos.length === 0 && selectedProjectKey) {
      // Clear selection if no keys
      setSelectedProjectKey(null);
    }
  }, [projectDtos, selectedProjectKey, setSelectedProjectKey]);

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

  const onConnectionChange = async (conn: JiraConnectionDto | null) => {
    setSelectedConnectionId(conn?.id || null);
  };

  const handleProjectChange = (proj: ProjectDto | null) => {
    setSelectedProjectKey(proj ? proj.key : null);
    setSelectedStoryKey(null);
  };

  const handleStoryChange = (story: StorySummary | null) => {
    setSelectedStoryKey(story ? story.key : null);
  };

  // Sessions loading handled by query

  const handleSelectSession = async (sessionKey: string) => {
    setSelectedSessionKey(sessionKey);
    router.push(`/chat/${sessionKey}`);
  };

  const handleNewChat = () => {
    setHeaderProjectKey(selectedProjectKey || "");
    setHeaderStoryKey(selectedStoryKey || "");
    setSelectedSessionKey(null);
    router.push(`/chat/`);
  };

  const sessionItems = useMemo<SessionItem[]>(() => {
    const items: SessionItem[] = [];
    sessions.forEach((session) => {
      items.push({
        id: session.key,
        title: session.key,
        subtitle: new Date(session.created_at).toLocaleString(),
      });
      if (session.key === selectedSessionKey) {
        setHeaderProjectKey(session.project_key);
        setHeaderStoryKey(session.story_key || "");
      }
    });
    return items;
  }, [sessions, selectedSessionKey, setHeaderProjectKey, setHeaderStoryKey]);

  return (
    <WorkspaceShell
      connectionOptions={{
        options: connections,
        onChange: onConnectionChange,
        selectedOption: selectedConnection,
      }}
      projectOptions={{
        options: projectDtos,
        onChange: handleProjectChange,
        selectedOption: selectedProjectDto,
      }}
      storyOptions={{
        options: storySummaries,
        onChange: handleStoryChange,
        selectedOption: selectedStorySummary,
      }}
      submitAction={{
        label: "New Chat",
        onClick: handleNewChat,
      }}
      sessions={sessionItems}
      selectedSessionId={selectedSessionKey}
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
