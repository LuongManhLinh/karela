import {useQuery } from "@tanstack/react-query";
import { chatService } from "@/services/chatService";

export const CHAT_KEYS = {
  all: ["chat"] as const,
  sessionsByConnection: (connectionName: string) =>
    [...CHAT_KEYS.all, "sessions", connectionName] as const,
  sessionsByProject: (connectionName: string, projectKey: string) =>
    [...CHAT_KEYS.all, "sessions", connectionName, projectKey] as const,
  sessionsByStory: (
    connectionName: string,
    projectKey: string,
    storyKey: string,
  ) =>
    [
      ...CHAT_KEYS.all,
      "sessions",
      connectionName,
      projectKey,
      storyKey,
    ] as const,
  session: (connectionName: string, sessionOrKey: string) =>
    [
      ...CHAT_KEYS.all,
      "session",
      connectionName,
      sessionOrKey,
    ] as const,
};

export const useChatSessionsByConnectionQuery = (
  connectionName: string | undefined,
) => {
  return useQuery({
    queryKey: CHAT_KEYS.sessionsByConnection(connectionName || ""),
    queryFn: () => chatService.listChatSessionsByConnection(connectionName!),
    enabled: !!connectionName,
  });
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
  });
};

export const useChatSessionQuery = (
  connectionName: string | undefined,
  sessionIdOrKey: string | undefined,
) => {
  return useQuery({
    queryKey: CHAT_KEYS.session(
      connectionName || "",
      sessionIdOrKey || "",
    ),
    queryFn: () =>
      chatService.getChatSession(connectionName!, sessionIdOrKey!),
    enabled: !!connectionName && !!sessionIdOrKey,
  });
};