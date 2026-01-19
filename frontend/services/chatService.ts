import apiClient from "./api";
import type { BasicResponse } from "@/types";
import type {
  ChatSessionSummary,
  ChatSessionDto,
  ChatSessionCreateRequest,
} from "@/types/chat";

export const chatService = {
  createChatSession: async (
    connectionId: string,
    projectKey: string,
    storyKey?: string,
  ): Promise<BasicResponse<string>> => {
    const request: ChatSessionCreateRequest = {
      connection_id: connectionId,
      project_key: projectKey,
      story_key: storyKey,
    };
    const response = await apiClient.post<BasicResponse<string>>(
      "/chat/",
      request,
    );
    return response.data;
  },
  listChatSessionsByProject: async (
    connectionId: string,
    projectKey: string,
  ): Promise<BasicResponse<ChatSessionSummary[]>> => {
    const response = await apiClient.get<BasicResponse<ChatSessionSummary[]>>(
      `/chat/connections/${connectionId}/projects/${projectKey}`
    );
    return response.data;
  },
  listChatSessionsByStory: async (
    connectionId: string,
    projectKey: string,
    storyKey: string,
  ): Promise<BasicResponse<ChatSessionSummary[]>> => {
    const response = await apiClient.get<BasicResponse<ChatSessionSummary[]>>(
      `/chat/connections/${connectionId}/projects/${projectKey}/stories/${storyKey}`
    );
    return response.data;
  },

  getChatSession: async (
    sessionIdOrKey: string,
  ): Promise<BasicResponse<ChatSessionDto>> => {
    const response = await apiClient.get<BasicResponse<ChatSessionDto>>(
      `/chat/${sessionIdOrKey}`,
    );
    return response.data;
  },
};
