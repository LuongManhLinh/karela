"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ChatSessionSummary } from "@/types/chat";
import type { ProjectDto } from "@/types/connection";
import {
  useChatSessionsByConnectionQuery,
  useChatSessionsByProjectQuery,
} from "@/hooks/queries/useChatQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

import { chatService } from "@/services/chatService";
import PageLayout from "../PageLayout";
import { useTranslations } from "next-intl";
import { useWebSocketContext } from "@/providers/WebSocketProvider";
import {
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  Skeleton,
  Typography,
} from "@mui/material";
import { scrollBarSx } from "@/constants/scrollBarSx";

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
  const tSessionList = useTranslations("SessionList");
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [selectedSessionKey, setSelectedSessionKey] = useState<string | null>(
    idOrKey || null,
  );

  const { setHeaderProjectKey, setHeaderStoryKey } = useWorkspaceStore();

  const connectionQuery = useChatSessionsByConnectionQuery();
  const projectQuery = useChatSessionsByProjectQuery(projectKey);
  const currentQuery = level === "connection" ? connectionQuery : projectQuery;

  const {
    data: sessionsData,
    isLoading: isSessionsLoading,
    refetch: refetchSessions,
  } = currentQuery;

  // Initialize sessions
  useEffect(() => {
    if (sessionsData?.data) {
      setSessions(sessionsData.data);
    }
  }, [sessionsData]);

  const handleSelectSession = async (sessionKey: string) => {
    setSelectedSessionKey(sessionKey);
    if (level === "connection") {
      router.push(`/app/chats/${sessionKey}`);
      return;
    }
    router.push(`/app/projects/${projectKey}/chats/${sessionKey}`);
  };

  const handleNewChat = async (project: ProjectDto) => {
    const newIdData = await chatService.createChatSession(project.key);
    const newId = newIdData.data;
    if (newId) {
      setSelectedSessionKey(newId);
    }
    await refetchSessions();
    return newId;
  };

  const handleTitleChange = useCallback(
    (sessionKey: string, newTitle: string) => {
      setSessions((prevSessions) =>
        prevSessions.map((s) =>
          s.key === sessionKey ? { ...s, title: newTitle } : s,
        ),
      );
    },
    [],
  );

  const { subscribe, unsubscribe } = useWebSocketContext();

  useEffect(() => {
    if (sessions.length === 0) return;
    const handlers: ((parsed: unknown) => void)[] = [];
    for (const session of sessions) {
      const sessionSpecificHandler = (parsed: unknown) => {
        const msg = parsed as { type?: string; data?: unknown };
        if (msg.type === "title" && typeof msg.data === "string") {
          handleTitleChange(session.key, msg.data);
        }
      };
      handlers.push(sessionSpecificHandler);
      subscribe(`chat:${session.key}`, sessionSpecificHandler);
    }

    return () => {
      for (let i = 0; i < sessions.length; i++) {
        unsubscribe(`chat:${sessions[i].key}`, handlers[i]);
      }
    };
  }, [sessions, subscribe, unsubscribe, handleTitleChange]);

  const sessionsComponent = (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {isSessionsLoading ? (
        <List
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            px: 1,
            ...scrollBarSx,
          }}
        >
          {[1, 2, 3, 4].map((idx) => (
            <ListItem
              key={`chat-skeleton-${idx}`}
              disablePadding
              sx={{ mb: 1 }}
            >
              <Box
                sx={{
                  width: "100%",
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Skeleton variant="text" width="65%" />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="rounded" width={120} height={22} />
              </Box>
            </ListItem>
          ))}
        </List>
      ) : sessions.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, px: 2 }}
        >
          {t("noSessions")}
        </Typography>
      ) : (
        <List
          sx={{
            flex: 1,
            minHeight: 0,
            px: 1,
            overflowY: "auto",
            ...scrollBarSx,
          }}
        >
          {sessions.map((session) => {
            const isSelected = selectedSessionKey === session.key;
            const isLoadingTitle = session.title === "<>loading</>";

            return (
              <ListItem
                key={session.key}
                disablePadding
                sx={{ mb: 0.75 }}
                title={session.title}
              >
                <ListItemButton
                  selected={isSelected}
                  onClick={() => handleSelectSession(session.key)}
                  sx={{
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: isSelected ? "primary.main" : "divider",
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{ width: "100%" }}>
                    {isLoadingTitle ? (
                      <Skeleton variant="text" width="70%" />
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          lineHeight: 1.3,
                        }}
                        noWrap
                      >
                        {session.title || t("untitled")}
                      </Typography>
                    )}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.4 }}
                    >
                      {new Date(session.created_at).toLocaleString()}
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.75,
                      }}
                    >
                      <Chip
                        size="small"
                        label={`${tSessionList("project")}: ${session.project_key}`}
                      />
                      {session.story_key && (
                        <Chip
                          size="small"
                          label={`${tSessionList("story")}: ${session.story_key}`}
                        />
                      )}
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );

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
      sessionsComponent={sessionsComponent}
      onNewLabel={t("newChat")}
      primaryActionLabel={t("create")}
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
