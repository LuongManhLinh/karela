import { useQuery } from "@tanstack/react-query";
import { chatService } from "@/services/chatService";

export const CHAT_KEYS = {
  all: ["chat"] as const,
  sessionsByConnection: () => [...CHAT_KEYS.all, "sessions"] as const,
  sessionsByProject: (projectKey: string) =>
    [...CHAT_KEYS.all, "sessions", projectKey] as const,
  session: (sessionOrKey: string) =>
    [...CHAT_KEYS.all, "session", sessionOrKey] as const,
};

export const useChatSessionsByConnectionQuery = () => {
  return useQuery({
    queryKey: CHAT_KEYS.sessionsByConnection(),
    queryFn: () => chatService.listChatSessionsByConnection(),
  });
};

export const useChatSessionsByProjectQuery = (
  projectKey: string | undefined,
) => {
  return useQuery({
    queryKey: CHAT_KEYS.sessionsByProject(projectKey || ""),
    queryFn: () => chatService.listChatSessionsByProject(projectKey!),
    enabled: !!projectKey,
  });
};

export const useChatSessionQuery = (sessionIdOrKey: string | undefined) => {
  return useQuery({
    queryKey: CHAT_KEYS.session(sessionIdOrKey || ""),
    queryFn: () => chatService.getChatSession(sessionIdOrKey!),
    enabled: !!sessionIdOrKey,
  });
};
