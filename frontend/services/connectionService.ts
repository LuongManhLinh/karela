import apiClient from "./api";
import type { BasicResponse } from "@/types";
import { ACDto, ACSummary } from "@/types/ac";
import {
  ConnectionSyncStatusDto,
  ProjectDashboardDto,
  ProjectDto,
  StoryDashboardDto,
  StoryDto,
  StorySummary,
} from "@/types/connection";
import type { UserConnections } from "@/types/user";

export const connectionService = {
  getUserConnections: async (): Promise<BasicResponse<UserConnections>> => {
    const response =
      await apiClient.get<BasicResponse<UserConnections>>("/connections/");
    return response.data;
  },

  getProjects: async (
    connectionName: string,
  ): Promise<BasicResponse<ProjectDto[]>> => {
    const response = await apiClient.get<BasicResponse<ProjectDto[]>>(
      `/connections/${connectionName}/projects`,
    );
    return response.data;
  },

  getStorySummaries: async (
    connectionName: string,
    projectKey: string,
  ): Promise<BasicResponse<StorySummary[]>> => {
    const response = await apiClient.get<BasicResponse<StorySummary[]>>(
      `/connections/${connectionName}/projects/${projectKey}/stories`,
    );
    return response.data;
  },

  deleteConnection: async (connectionId: string): Promise<BasicResponse> => {
    const response = await apiClient.delete<BasicResponse>(
      `/connections/${connectionId}`,
    );
    return response.data;
  },

  getStory: async (
    connId: string,
    projectKey: string,
    storyKey: string,
  ): Promise<BasicResponse<StoryDto>> => {
    const response = await apiClient.get<BasicResponse<StoryDto>>(
      `/connections/${connId}/projects/${projectKey}/stories/${storyKey}`,
    );
    return response.data;
  },

  getConnectionSyncStatus: async (
    connectionId: string,
  ): Promise<BasicResponse<ConnectionSyncStatusDto>> => {
    const response = await apiClient.get<
      BasicResponse<ConnectionSyncStatusDto>
    >(`/connections/${connectionId}/sync-status`);
    return response.data;
  },

  getProjectDashboardInfo: async (
    connectionId: string,
    projectKey: string,
  ): Promise<BasicResponse<ProjectDashboardDto>> => {
    const response = await apiClient.get<BasicResponse<ProjectDashboardDto>>(
      `/connections/${connectionId}/projects/${projectKey}/dashboard`,
    );
    return response.data;
  },
  getStoryDashboardInfo: async (
    connectionId: string,
    projectKey: string,
    storyKey: string,
  ): Promise<BasicResponse<StoryDashboardDto>> => {
    const response = await apiClient.get<BasicResponse<StoryDashboardDto>>(
      `/connections/${connectionId}/projects/${projectKey}/stories/${storyKey}/dashboard`,
    );
    return response.data;
  },
};
