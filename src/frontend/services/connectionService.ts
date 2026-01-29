import apiClient from "./api";
import type { BasicResponse } from "@/types";
import {
  ConnectionDashboardDto,
  ConnectionDto,
  ConnectionSyncStatusDto,
  ProjectDashboardDto,
  ProjectDto,
  StoryDashboardDto,
  StoryDto,
  StorySummary,
} from "@/types/connection";
import type { UserConnections } from "@/types/user";

export const connectionService = {
  getUserConnections: async (): Promise<BasicResponse<ConnectionDto[]>> => {
    const response =
      await apiClient.get<BasicResponse<ConnectionDto[]>>("/connections/");
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
    connectionName: string,
    storyKey: string,
  ): Promise<BasicResponse<StoryDto>> => {
    const response = await apiClient.get<BasicResponse<StoryDto>>(
      `/connections/${connectionName}/stories/${storyKey}`,
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
    connectionName: string,
    projectKey: string,
  ): Promise<BasicResponse<ProjectDashboardDto>> => {
    const response = await apiClient.get<BasicResponse<ProjectDashboardDto>>(
      `/connections/${connectionName}/projects/${projectKey}/dashboard`,
    );
    return response.data;
  },

  getStoryDashboardInfo: async (
    connectionName: string,
    projectKey: string,
    storyKey: string,
  ): Promise<BasicResponse<StoryDashboardDto>> => {
    const response = await apiClient.get<BasicResponse<StoryDashboardDto>>(
      `/connections/${connectionName}/projects/${projectKey}/stories/${storyKey}/dashboard`,
    );
    return response.data;
  },

  getConnectionDashboardInfo: async (
    connectionName: string,
  ): Promise<BasicResponse<ConnectionDashboardDto>> => {
    const response = await apiClient.get<BasicResponse<ConnectionDashboardDto>>(
      `/connections/${connectionName}/dashboard`,
    );
    return response.data;
  },
};
