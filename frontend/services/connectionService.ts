import apiClient from "./api";
import type { BasicResponse } from "@/types";
import { ACDto, ACSummary } from "@/types/ac";
import {
  ConnectionSyncStatusDto,
  ProjectDto,
  StoryDto,
  StorySummary,
} from "@/types/integration";
import type { UserConnections } from "@/types/user";

export const connectionService = {
  getUserConnections: async (): Promise<BasicResponse<UserConnections>> => {
    const response = await apiClient.get<BasicResponse<UserConnections>>(
      "/connections"
    );
    return response.data;
  },

  getProjects: async (
    connectionIdOrName: string
  ): Promise<BasicResponse<ProjectDto[]>> => {
    const response = await apiClient.get<BasicResponse<ProjectDto[]>>(
      `/connections/${connectionIdOrName}/projects`
    );
    return response.data;
  },

  getStorySummaries: async (
    connId: string,
    projectKey: string
  ): Promise<BasicResponse<StorySummary[]>> => {
    const response = await apiClient.get<BasicResponse<StorySummary[]>>(
      `/connections/${connId}/projects/${projectKey}/stories`
    );
    return response.data;
  },

  deleteConnection: async (connectionId: string): Promise<BasicResponse> => {
    const response = await apiClient.delete<BasicResponse>(
      `/connections/${connectionId}`
    );
    return response.data;
  },

  getStory: async (
    connId: string,
    projectKey: string,
    storyKey: string
  ): Promise<BasicResponse<StoryDto>> => {
    const response = await apiClient.get<BasicResponse<StoryDto>>(
      `/connections/${connId}/projects/${projectKey}/stories/${storyKey}`
    );
    return response.data;
  },

  getConnectionSyncStatus: async (
    connectionId: string
  ): Promise<BasicResponse<ConnectionSyncStatusDto>> => {
    const response = await apiClient.get<
      BasicResponse<ConnectionSyncStatusDto>
    >(`/connections/${connectionId}/sync-status`);
    return response.data;
  },

  getACs: async (
    connectionId: string,
    projectKey: string,
    storyKey: string
  ): Promise<BasicResponse<ACDto[]>> => {
    const response = await apiClient.get<BasicResponse<ACDto[]>>(
      `/connections/${connectionId}/projects/${projectKey}/stories/${storyKey}/acs`
    );
    return response.data;
  },

  createAC: async (
    connectionId: string,
    projectKey: string,
    storyKey: string,
    genWithAI: boolean
  ): Promise<BasicResponse<string>> => {
    const response = await apiClient.post<BasicResponse<string>>(
      `/connections/${connectionId}/projects/${projectKey}/stories/${storyKey}/acs`,
      { gen_with_ai: genWithAI }
    );
    return response.data;
  },
  regenerateAC: async (
    connectionId: string,
    projectKey: string,
    storyKey: string,
    acId: string,
    gherkin?: string,
    feedback?: string
  ): Promise<BasicResponse<string>> => {
    const response = await apiClient.put<BasicResponse<string>>(
      `/connections/${connectionId}/projects/${projectKey}/stories/${storyKey}/acs/${acId}/regenerate`,
      { content: gherkin, feedback }
    );
    return response.data;
  },
  getAC: async (
    connectionId: string,
    projectKey: string,
    storyKey: string,
    acId: string
  ): Promise<BasicResponse<ACDto>> => {
    const response = await apiClient.get<BasicResponse<ACDto>>(
      `/connections/${connectionId}/projects/${projectKey}/stories/${storyKey}/acs/${acId}`
    );
    return response.data;
  },
  updateAC: async (
    connectionId: string,
    projectKey: string,
    storyKey: string,
    acId: string,
    content: string
  ): Promise<BasicResponse> => {
    const response = await apiClient.put<BasicResponse>(
      `/connections/${connectionId}/projects/${projectKey}/stories/${storyKey}/acs/${acId}`,
      { content }
    );
    return response.data;
  },
  deleteAC: async (
    connectionId: string,
    projectKey: string,
    storyKey: string,
    acId: string
  ): Promise<BasicResponse> => {
    const response = await apiClient.delete<BasicResponse>(
      `/connections/${connectionId}/projects/${projectKey}/stories/${storyKey}/acs/${acId}`
    );
    return response.data;
  },
  getACsByProject: async (
    connectionId: string,
    projectKey: string
  ): Promise<BasicResponse<ACSummary[]>> => {
    const response = await apiClient.get<BasicResponse<ACSummary[]>>(
      `/connections/${connectionId}/projects/${projectKey}/acs`
    );
    return response.data;
  },
};
