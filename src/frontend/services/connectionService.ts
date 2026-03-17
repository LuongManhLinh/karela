import apiClient from "./api";
import type { BasicResponse } from "@/types";
import {
  ConnectionDashboardDto,
  ConnectionDto,
  ConnectionSyncStatusDto,
  ProjectDashboardDto,
  ProjectDto,
  ProjectDtoSync,
  StoryDashboardDto,
  StoryDto,
  StorySummary,
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
  getProjectsSyncStatus: async (): Promise<BasicResponse<ProjectDtoSync[]>> => {
    const response = await apiClient.get<BasicResponse<ProjectDtoSync[]>>(
      `/connections/projects/sync-status`,
    );
    return response.data;
  },
  syncProjects: async (
    projectKeys: string[],
    runAnalysisAfterSync: boolean,
  ): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      `/connections/projects/sync`,
      {
        project_keys: projectKeys,
        run_analysis_after_sync: runAnalysisAfterSync,
      },
    );
    return response.data;
  },
};
