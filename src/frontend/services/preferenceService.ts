import apiClient from "./api";
import type { BasicResponse } from "@/types";
import type {
  PreferenceDto,
  CreatePreferenceRequest,
  UpdatePreferenceRequest,
} from "@/types/preference";

export const preferenceService = {
  // ── Preference CRUD ─────────────────────────────────────────

  getPreference: async (
    projectKey: string,
  ): Promise<BasicResponse<PreferenceDto>> => {
    const response = await apiClient.get<BasicResponse<PreferenceDto>>(
      `/preferences/projects/${projectKey}`,
    );
    return response.data;
  },

  createPreference: async (
    projectKey: string,
    data: CreatePreferenceRequest,
  ): Promise<BasicResponse<PreferenceDto>> => {
    const response = await apiClient.post<BasicResponse<PreferenceDto>>(
      `/preferences/projects/${projectKey}`,
      data,
    );
    return response.data;
  },

  updatePreference: async (
    projectKey: string,
    data: UpdatePreferenceRequest,
  ): Promise<BasicResponse<PreferenceDto>> => {
    const response = await apiClient.put<BasicResponse<PreferenceDto>>(
      `/preferences/projects/${projectKey}`,
      data,
    );
    return response.data;
  },
};
