import apiClient from "./api";
import type { BasicResponse } from "@/types";
import {
  ConnectionDashboardDto,
  ConnectionDto,
  ConnectionSyncStatusDto,
  ProjectDashboardDto,
  ProjectDto,
  ProjectSyncDto,
  StoryDashboardDto,
  StoryDto,
  StorySummary,
  SyncProject,
  SyncProjectsRequests,
  ProjectInfo,
  StoryInfo,
} from "@/types/connection";

export const connectionService = {
  getConnectionDto: async (): Promise<BasicResponse<ConnectionDto>> => {
    const response =
      await apiClient.get<BasicResponse<ConnectionDto>>("/connections/");
    return response.data;
  },

  getProjects: async (): Promise<BasicResponse<ProjectDto[]>> => {
    const response = await apiClient.get<BasicResponse<ProjectDto[]>>(
      `/connections/projects`,
    );
    return response.data;
  },

  getStorySummaries: async (
    projectKey: string,
  ): Promise<BasicResponse<StorySummary[]>> => {
    const response = await apiClient.get<BasicResponse<StorySummary[]>>(
      `/connections/projects/${projectKey}/stories`,
    );
    return response.data;
  },

  deleteConnection: async (): Promise<BasicResponse> => {
    const response = await apiClient.delete<BasicResponse>(`/connections/`);
    return response.data;
  },

  getStory: async (storyKey: string): Promise<BasicResponse<StoryDto>> => {
    const response = await apiClient.get<BasicResponse<StoryDto>>(
      `/connections/stories/${storyKey}`,
    );
    return response.data;
  },

  getConnectionSyncStatus: async (): Promise<
    BasicResponse<ConnectionSyncStatusDto>
  > => {
    const response = await apiClient.get<
      BasicResponse<ConnectionSyncStatusDto>
    >(`/connections/sync-status`);
    return response.data;
  },

  getProjectDashboardInfo: async (
    projectKey: string,
  ): Promise<BasicResponse<ProjectDashboardDto>> => {
    const response = await apiClient.get<BasicResponse<ProjectDashboardDto>>(
      `/connections/projects/${projectKey}/dashboard`,
    );
    return response.data;
  },

  getDashboardStories: async (
    projectKey: string,
    skip: number = 0,
    limit: number = 10,
  ): Promise<BasicResponse<StoryInfo[]>> => {
    const response = await apiClient.get<BasicResponse<StoryInfo[]>>(
      `/connections/projects/${projectKey}/dashboard/stories`,
      { params: { skip, limit } },
    );
    return response.data;
  },

  getStoryDashboardInfo: async (
    projectKey: string,
    storyKey: string,
  ): Promise<BasicResponse<StoryDashboardDto>> => {
    const response = await apiClient.get<BasicResponse<StoryDashboardDto>>(
      `/connections/projects/${projectKey}/stories/${storyKey}/dashboard`,
    );
    return response.data;
  },

  getConnectionDashboardInfo: async (): Promise<
    BasicResponse<ConnectionDashboardDto>
  > => {
    const response = await apiClient.get<BasicResponse<ConnectionDashboardDto>>(
      `/connections/dashboard`,
    );
    return response.data;
  },

  getDashboardProjects: async (
    skip: number = 0,
    limit: number = 5,
  ): Promise<BasicResponse<ProjectInfo[]>> => {
    const response = await apiClient.get<BasicResponse<ProjectInfo[]>>(
      `/connections/dashboard/projects`,
      { params: { skip, limit } },
    );
    return response.data;
  },
  getProjectsSyncStatus: async (): Promise<BasicResponse<ProjectSyncDto[]>> => {
    const response = await apiClient.get<BasicResponse<ProjectSyncDto[]>>(
      `/connections/projects/sync-status`,
    );
    return response.data;
  },
  syncProjects: async (projects: SyncProject[]): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      `/connections/projects/sync`,
      {
        projects,
      } as SyncProjectsRequests,
    );
    return response.data;
  },
  getProjectDescription: async (
    projectKey: string,
  ): Promise<BasicResponse<string>> => {
    const response = await apiClient.get<BasicResponse<string>>(
      `/connections/projects/${projectKey}/description`,
    );
    return response.data;
  },
  updateProjectDescription: async (
    projectKey: string,
    description: string,
  ): Promise<BasicResponse> => {
    const response = await apiClient.put<BasicResponse>(
      `/connections/projects/${projectKey}/description`,
      {
        description,
      },
    );
    return response.data;
  },
};
