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
  useChatSessionsByConnectionQuery,
  useChatSessionsByProjectQuery,
  useChatSessionsByStoryQuery,
} from "@/hooks/queries/useChatQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

import { chatService } from "@/services/chatService";
import PageLayout from "../PageLayout";
import { useTranslations } from "next-intl";
import { PageLevel } from "@/types";

interface ChatLayoutProps {
  children?: React.ReactNode;
  level: PageLevel;
  connectionName: string;
  projectKey?: string;
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
  const t = useTranslations("chat.ChatLayout");
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [selectedSessionKey, setSelectedSessionKey] = useState<string | null>(
    idOrKey || null,
  );

  const { setHeaderProjectKey, setHeaderStoryKey } = useWorkspaceStore();

  const getDataQuery = () => {
    switch (level) {
      case "connection":
        return useChatSessionsByConnectionQuery(connectionName);
      case "project":
        return useChatSessionsByProjectQuery(connectionName, projectKey!);
      case "story":
        return useChatSessionsByStoryQuery(
          connectionName,
          projectKey!,
          storyKey!,
        );
    }
  };

  const {
    data: sessionsData,
    isLoading: isSessionsLoading,
    refetch: refetchSessions,
  } = getDataQuery();

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
    story?: StorySummary,
  ) => {
    const newIdData = await chatService.createChatSession(
      connection.id,
      project.key,
      story ? story.key : undefined,
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
      headerText={t("headerText")}
      connectionName={connectionName}
      projectKey={projectKey}
      storyKey={storyKey}
      href="chats"
      primarySessions={{
        sessions: sessionItems,
        selectedSessionId: selectedSessionKey,
        onSelectSession: handleSelectSession,
        loading: isSessionsLoading,
        emptyStateText: t("noSessions"),
        label: t("sessionsLabel"),
      }}
      onNewLabel={t("newChat")}
      dialogLabel={t("createChatLabel")}
      primaryAction={handleNewChat}
    >
      {children}
    </PageLayout>
  );
};

export default ChatLayout;
