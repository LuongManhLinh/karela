import apiClient from "./api";
import type {
  BasicResponse,
  ChatSessionSummary,
  ChatSessionDto,
  ChatProposalDto,
} from "@/types";

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

  getChatSession: async (sessionId: string): Promise<BasicResponse<ChatSessionDto>> => {
    const response = await apiClient.get<BasicResponse<ChatSessionDto>>(
      `/chat/${sessionId}`
    );
    return response.data;
  },

  getChatProposal: async (
    sessionId: string,
    proposalId: number
  ): Promise<BasicResponse<ChatProposalDto>> => {
    const response = await apiClient.get<BasicResponse<ChatProposalDto>>(
      `/chat/${sessionId}/proposals/${proposalId}`
    );
    return response.data;
  },

  acceptProposal: async (
    sessionId: string,
    proposalId: number
  ): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      `/chat/${sessionId}/proposals/${proposalId}/accept`
    );
    return response.data;
  },

  rejectProposal: async (
    sessionId: string,
    proposalId: number
  ): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      `/chat/${sessionId}/proposals/${proposalId}/reject`
    );
    return response.data;
  },

  revertProposal: async (
    sessionId: string,
    proposalId: number
  ): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      `/chat/${sessionId}/proposals/${proposalId}/revert`
    );
    return response.data;
  },

  // Note: This endpoint doesn't exist in the backend yet
  // For now, we'll add the message via WebSocket init or handle it differently
  addMessage: async (
    sessionId: string,
    content: string
  ): Promise<BasicResponse> => {
    // This is a placeholder - the backend doesn't have this endpoint yet
    // We'll need to add the message through the WebSocket or create an endpoint
    throw new Error("Add message endpoint not implemented in backend");
  },
};

