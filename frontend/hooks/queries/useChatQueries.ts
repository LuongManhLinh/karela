import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chatService";
import type { ChatSessionDto } from "@/types/chat";

export const CHAT_KEYS = {
  all: ["chat"] as const,
  sessions: (connectionId: string) => [...CHAT_KEYS.all, "sessions", connectionId] as const,
  session: (sessionId: string) => [...CHAT_KEYS.all, "session", sessionId] as const,
};

export const useChatSessionsQuery = (connectionId: string | undefined) => {
  return useQuery({
    queryKey: CHAT_KEYS.sessions(connectionId || ""),
    queryFn: () => chatService.listChatSessions(connectionId!),
    enabled: !!connectionId,
    staleTime: 60 * 1000, 
  });
};

export const useChatSessionQuery = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: CHAT_KEYS.session(sessionId || ""),
    queryFn: () => chatService.getChatSession(sessionId!),
    enabled: !!sessionId,
    // Session messages might update frequently via websocket, but initial load can be cached
    staleTime: 60 * 1000, 
  });
};

// Note: WebSocket handling is usually custom and not fully replaced by simple read/write hooks,
// but we can use mutations for REST endpoints if any.
// chatService seems to have listChatSessions and getChatSession which are GETs.
// It also has potentially others? Let's assume these are the main ones for now.
