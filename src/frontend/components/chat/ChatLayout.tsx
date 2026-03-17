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
} from "@/hooks/queries/useChatQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

import { chatService } from "@/services/chatService";
import PageLayout from "../PageLayout";
import { useTranslations } from "next-intl";
import { PageLevel } from "@/types";

interface ChatLayoutProps {
  children?: React.ReactNode;
  level: "connection" | "project";
  projectKey?: string;
  idOrKey?: string;
}
const ChatLayout: React.FC<ChatLayoutProps> = ({
  children,
  level,
  projectKey,
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
        return useChatSessionsByConnectionQuery();
      case "project":
        return useChatSessionsByProjectQuery(projectKey!);
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
    project: ProjectDto,
  ) => {
    const newIdData = await chatService.createChatSession(
      project.key,
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
      projectKey={projectKey}
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
      requireStory={false}
      showStoryCheckbox={false}
    >
      {children}
    </PageLayout>
  );
};

export default ChatLayout;
