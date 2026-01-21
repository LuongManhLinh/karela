import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chatService";
import type { ChatSessionDto } from "@/types/chat";
import { connect } from "http2";

export const CHAT_KEYS = {
  all: ["chat"] as const,
  sessionsByProject: (connectionId: string, projectKey: string) =>
    [...CHAT_KEYS.all, "sessions", connectionId, projectKey] as const,
  sessionsByStory: (
    connectionId: string,
    projectKey: string,
    storyKey: string,
  ) =>
    [...CHAT_KEYS.all, "sessions", connectionId, projectKey, storyKey] as const,
  session: (sessionOrKey: string, connectionName: string, projectKey: string) =>
    [
      ...CHAT_KEYS.all,
      "session",
      sessionOrKey,
      connectionName,
      projectKey,
    ] as const,
};

export const useChatSessionsByProjectQuery = (
  connectionName: string | undefined,
  projectKey: string | undefined,
) => {
  return useQuery({
    queryKey: CHAT_KEYS.sessionsByProject(
      connectionName || "",
      projectKey || "",
    ),
    queryFn: () =>
      chatService.listChatSessionsByProject(connectionName!, projectKey!),
    enabled: !!connectionName && !!projectKey,
    staleTime: 60 * 1000,
  });
};

export const useChatSessionsByStoryQuery = (
  connectionName: string | undefined,
  projectKey: string | undefined,
  storyKey: string | undefined,
) => {
  return useQuery({
    queryKey: CHAT_KEYS.sessionsByStory(
      connectionName || "",
      projectKey || "",
      storyKey || "",
    ),
    queryFn: () =>
      chatService.listChatSessionsByStory(
        connectionName!,
        projectKey!,
        storyKey!,
      ),
    enabled: !!connectionName && !!projectKey && !!storyKey,
    staleTime: 60 * 1000,
  });
};

export const useChatSessionQuery = (
  connectionName: string | undefined,
  projectKey: string | undefined,
  sessionIdOrKey: string | undefined,
) => {
  return useQuery({
    queryKey: CHAT_KEYS.session(
      sessionIdOrKey || "",
      connectionName || "",
      projectKey || "",
    ),
    queryFn: () =>
      chatService.getChatSession(connectionName!, projectKey!, sessionIdOrKey!),
    enabled: !!connectionName && !!projectKey && !!sessionIdOrKey,
    staleTime: 60 * 1000,
  });
};

// Note: WebSocket handling is usually custom and not fully replaced by simple read/write hooks,
// but we can use mutations for REST endpoints if any.
// chatService seems to have listChatSessions and getChatSession which are GETs.
// It also has potentially others? Let's assume these are the main ones for now.
