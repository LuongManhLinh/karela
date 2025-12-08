import apiClient from "./api";
import type { BasicResponse } from "@/types";
import type {
  ChatSessionSummary,
  ChatMessageDto,
  ChatSessionDto,
} from "@/types/chat";

export const chatService = {
  listChatSessions: async (
    connectionId: string
  ): Promise<BasicResponse<ChatSessionSummary[]>> => {
    const response = await apiClient.get<BasicResponse<ChatSessionSummary[]>>(
      "/chat/",
      {
        params: { connection_id: connectionId },
      }
    );
    return response.data;
  },

  getChatSession: async (
    sessionId: string
  ): Promise<BasicResponse<ChatSessionDto>> => {
    const response = await apiClient.get<BasicResponse<ChatSessionDto>>(
      `/chat/${sessionId}`
    );
    return response.data;
  },
};
