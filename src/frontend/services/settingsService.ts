import apiClient from "./api";
import type { BasicResponse } from "@/types";
import type {
  SettingsDto,
  CreateSettingsRequest,
  UpdateSettingsRequest,
} from "@/types/settings";

export const settingsService = {
  getSettings: async (
    projectKey: string
  ): Promise<BasicResponse<SettingsDto>> => {
    const response = await apiClient.get<BasicResponse<SettingsDto>>(
      `/settings/projects/${projectKey}`
    );
    return response.data;
  },

  listSettings: async (
  
  ): Promise<BasicResponse<SettingsDto[]>> => {
    const response = await apiClient.get<BasicResponse<SettingsDto[]>>(
      `/settings/`
    );
    return response.data;
  },

  createSettings: async (

    projectKey: string,
    data: CreateSettingsRequest
  ): Promise<BasicResponse<SettingsDto>> => {
    const response = await apiClient.post<BasicResponse<SettingsDto>>(
      `/settings/projects/${projectKey}`,
      data
    );
    return response.data;
  },

  updateSettings: async (

    projectKey: string,
    data: UpdateSettingsRequest
  ): Promise<BasicResponse<SettingsDto>> => {
    const response = await apiClient.put<BasicResponse<SettingsDto>>(
      `/settings/projects/${projectKey}`,
      data
    );
    return response.data;
  },

  deleteSettings: async (

    projectKey: string
  ): Promise<BasicResponse> => {
    const response = await apiClient.delete<BasicResponse>(
      `/settings/projects/${projectKey}`
    );
    return response.data;
  },
};
