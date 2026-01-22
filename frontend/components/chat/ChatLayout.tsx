"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { ChatSessionSummary } from "@/types/chat";
import type {
  ConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/connection";
import { SessionItem } from "@/components/SessionList";
import {
  useChatSessionsByProjectQuery,
  useChatSessionsByStoryQuery,
} from "@/hooks/queries/useChatQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { USE_NO_STORY } from "@/constants/selectable";

import { chatService } from "@/services/chatService";
import PageLayout from "../PageLayout";

interface ChatLayoutProps {
  children?: React.ReactNode;
  level: "project" | "story";
  connectionName: string;
  projectKey: string;
  storyKey?: string; // Required if level is "story"
  idOrKey?: string;
}
const ChatLayout: React.FC<ChatLayoutProps> = ({
  children,
  level,
  connectionName,
  projectKey,
  storyKey,
  idOrKey,
}) => {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [selectedSessionKey, setSelectedSessionKey] = useState<string | null>(
    idOrKey || null,
  );

  const { setHeaderProjectKey, setHeaderStoryKey } = useWorkspaceStore();

  const {
    data: sessionsData,
    isLoading: isSessionsLoading,
    refetch: refetchSessions,
  } = level === "project"
    ? useChatSessionsByProjectQuery(connectionName, projectKey)
    : useChatSessionsByStoryQuery(connectionName, projectKey, storyKey!);

  // Initialize sessions
  useEffect(() => {
    if (sessionsData?.data) {
      setSessions(sessionsData.data);
    }
  }, [sessionsData]);

  const handleSelectSession = async (sessionKey: string) => {
    setSelectedSessionKey(sessionKey);
  };

  const handleNewChat = async (
    connection: ConnectionDto,
    project: ProjectDto,
    story: StorySummary,
  ) => {
    const newIdData = await chatService.createChatSession(
      connection.id,
      project.key,
      story.id === USE_NO_STORY.id ? undefined : story.key,
    );
    const newId = newIdData.data;
    if (newId) {
      setSelectedSessionKey(newId);
    }
    await refetchSessions();
    return newId;
  };

  const sessionItems = useMemo<SessionItem[]>(() => {
    const items: SessionItem[] = [];
    sessions.forEach((session) => {
      items.push({
        id: session.key,
        title: session.key,
        subtitle: new Date(session.created_at).toLocaleString(),
      });
    });
    return items;
  }, [sessions]);

  // Update header keys in useEffect to avoid setState during render
  useEffect(() => {
    const selectedSummary = sessions.find((s) => s.key === selectedSessionKey);
    if (selectedSummary) {
      setHeaderProjectKey(selectedSummary.project_key);
      setHeaderStoryKey(selectedSummary.story_key || "");
    }
  }, [sessions, selectedSessionKey, setHeaderProjectKey, setHeaderStoryKey]);

  return (
    <PageLayout
      level={level}
      connectionName={connectionName}
      projectKey={projectKey}
      storyKey={storyKey}
      href="chats"
      primarySessions={{
        sessions: sessionItems,
        selectedSessionId: selectedSessionKey,
        onSelectSession: handleSelectSession,
        loading: isSessionsLoading,
        emptyStateText: "No chat sessions found",
        label: "Chat Sessions",
      }}
      onNewLabel="New Chat"
      dialogLabel="Create Chat Session"
      primaryAction={handleNewChat}
      useNoStoryFilter
      useNoStoryRunner
    >
      {children}
    </PageLayout>
  );
};

export default ChatLayout;
