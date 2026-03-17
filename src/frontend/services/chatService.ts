import apiClient from "./api";
import type { BasicResponse } from "@/types";
import type {
  ChatSessionSummary,
  ChatSessionDto,
  ChatSessionCreateRequest,
} from "@/types/chat";

export const chatService = {
  createChatSession: async (
    projectKey: string,
  ): Promise<BasicResponse<string>> => {
    const request: ChatSessionCreateRequest = {
      project_key: projectKey,
    };
    const response = await apiClient.post<BasicResponse<string>>(
      "/chat/",
      request,
    );
    return response.data;
  },
  listChatSessionsByConnection: async (): Promise<
    BasicResponse<ChatSessionSummary[]>
  > => {
    const response =
      await apiClient.get<BasicResponse<ChatSessionSummary[]>>(`/chat/`);
    return response.data;
  },
  listChatSessionsByProject: async (
    projectKey: string,
  ): Promise<BasicResponse<ChatSessionSummary[]>> => {
    const response = await apiClient.get<BasicResponse<ChatSessionSummary[]>>(
      `/chat/projects/${projectKey}`,
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
