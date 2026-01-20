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
}
const ChatLayout: React.FC<ChatLayoutProps> = ({ children, level }) => {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [selectedSessionKey, setSelectedSessionKey] = useState<string | null>(
    null,
  );

  const {
    selectedConnection,
    selectedProject,
    selectedStory,
    setHeaderProjectKey,
    setHeaderStoryKey,
  } = useWorkspaceStore();

  const { data: sessionsData, isLoading: isSessionsLoading } =
    level === "project"
      ? useChatSessionsByProjectQuery(
          selectedConnection?.id || undefined,
          selectedProject?.key || undefined,
        )
      : useChatSessionsByStoryQuery(
          selectedConnection?.id || undefined,
          selectedProject?.key || undefined,
          selectedStory?.key || undefined,
        );

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
      if (session.key === selectedSessionKey) {
        setHeaderProjectKey(session.project_key);
        setHeaderStoryKey(session.story_key || "");
      }
    });
    return items;
  }, [sessions, selectedSessionKey, setHeaderProjectKey, setHeaderStoryKey]);

  return (
    <PageLayout
      level={level}
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
