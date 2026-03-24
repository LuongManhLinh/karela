import apiClient from "./api";
import type { BasicResponse } from "@/types";
import type {
  SettingsDto,
  CreateSettingsRequest,
  UpdateSettingsRequest,
  PreferenceDto,
  CreatePreferenceRequest,
  UpdatePreferenceRequest,
} from "@/types/settings";

export const settingsService = {
  // ── Documentation CRUD ──────────────────────────────────────

  getSettings: async (
    projectKey: string
  ): Promise<BasicResponse<SettingsDto>> => {
    const response = await apiClient.get<BasicResponse<SettingsDto>>(
      `/settings/projects/${projectKey}`
    );
    return response.data;
  },

  listSettings: async (): Promise<BasicResponse<SettingsDto[]>> => {
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

  // ── File upload / download / delete ─────────────────────────

  uploadFile: async (
    projectKey: string,
    file: File
  ): Promise<BasicResponse<SettingsDto>> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<BasicResponse<SettingsDto>>(
      `/settings/projects/${projectKey}/files`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  downloadFile: async (
    projectKey: string,
    filename: string
  ): Promise<Blob> => {
    const response = await apiClient.get(
      `/settings/projects/${projectKey}/files/${encodeURIComponent(filename)}`,
      { responseType: "blob" }
    );
    return response.data;
  },

  deleteFile: async (
    projectKey: string,
    filename: string
  ): Promise<BasicResponse<SettingsDto>> => {
    const response = await apiClient.delete<BasicResponse<SettingsDto>>(
      `/settings/projects/${projectKey}/files/${encodeURIComponent(filename)}`
    );
    return response.data;
  },

  // ── Preference CRUD ─────────────────────────────────────────

  getPreference: async (
    projectKey: string
  ): Promise<BasicResponse<PreferenceDto>> => {
    const response = await apiClient.get<BasicResponse<PreferenceDto>>(
      `/settings/preferences/projects/${projectKey}`
    );
    return response.data;
  },

  createPreference: async (
    projectKey: string,
    data: CreatePreferenceRequest
  ): Promise<BasicResponse<PreferenceDto>> => {
    const response = await apiClient.post<BasicResponse<PreferenceDto>>(
      `/settings/preferences/projects/${projectKey}`,
      data
    );
    return response.data;
  },

  updatePreference: async (
    projectKey: string,
    data: UpdatePreferenceRequest
  ): Promise<BasicResponse<PreferenceDto>> => {
    const response = await apiClient.put<BasicResponse<PreferenceDto>>(
      `/settings/preferences/projects/${projectKey}`,
      data
    );
    return response.data;
  },
};
