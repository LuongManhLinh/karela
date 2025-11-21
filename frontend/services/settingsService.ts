import apiClient from "./api";
import type {
  BasicResponse,
  SettingsDto,
  CreateSettingsRequest,
  UpdateSettingsRequest,
} from "@/types";

export const settingsService = {
  getSettings: async (
    connectionId: string,
    projectKey: string
  ): Promise<BasicResponse<SettingsDto>> => {
    const response = await apiClient.get<BasicResponse<SettingsDto>>(
      `/settings/connections/${connectionId}/projects/${projectKey}`
    );
    return response.data;
  },

  listSettings: async (
    connectionId: string
  ): Promise<BasicResponse<SettingsDto[]>> => {
    const response = await apiClient.get<BasicResponse<SettingsDto[]>>(
      `/settings/connections/${connectionId}`
    );
    return response.data;
  },

  createSettings: async (
    connectionId: string,
    projectKey: string,
    data: CreateSettingsRequest
  ): Promise<BasicResponse<SettingsDto>> => {
    const response = await apiClient.post<BasicResponse<SettingsDto>>(
      `/settings/connections/${connectionId}/projects/${projectKey}`,
      data
    );
    return response.data;
  },

  updateSettings: async (
    connectionId: string,
    projectKey: string,
    data: UpdateSettingsRequest
  ): Promise<BasicResponse<SettingsDto>> => {
    const response = await apiClient.put<BasicResponse<SettingsDto>>(
      `/settings/connections/${connectionId}/projects/${projectKey}`,
      data
    );
    return response.data;
  },

  deleteSettings: async (
    connectionId: string,
    projectKey: string
  ): Promise<BasicResponse> => {
    const response = await apiClient.delete<BasicResponse>(
      `/settings/connections/${connectionId}/projects/${projectKey}`
    );
    return response.data;
  },
};

