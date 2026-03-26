import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";
import type {
  CreateSettingsRequest,
  UpdateSettingsRequest,
  CreatePreferenceRequest,
  UpdatePreferenceRequest,
} from "@/types/settings";

// ── Documentation (Settings) keys & hooks ─────────────────────

export const SETTINGS_KEYS = {
  all: ["settings"] as const,
  byProject: (projectKey: string) =>
    [...SETTINGS_KEYS.all, projectKey] as const,
};

export const useDocumentationQuery = (projectKey: string | undefined) => {
  return useQuery({
    queryKey: SETTINGS_KEYS.byProject(projectKey || ""),
    queryFn: () => settingsService.getSettings(projectKey!),
    enabled: !!projectKey,
    retry: false,
  });
};

export const useCreateDocumentationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectKey,
      data,
    }: {
      projectKey: string;
      data: CreateSettingsRequest;
    }) => settingsService.createSettings(projectKey, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: SETTINGS_KEYS.byProject(variables.projectKey),
      });
    },
  });
};

export const useUpdateDocumentationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectKey,
      data,
    }: {
      projectKey: string;
      data: UpdateSettingsRequest;
    }) => settingsService.updateSettings(projectKey, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: SETTINGS_KEYS.byProject(variables.projectKey),
      });
    },
  });
};

// ── File mutations ────────────────────────────────────────────

export const useUploadFileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectKey,
      file,
      description,
    }: {
      projectKey: string;
      file: File;
      description?: string;
    }) => settingsService.uploadFile(projectKey, file, description),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: SETTINGS_KEYS.byProject(variables.projectKey),
      });
    },
  });
};

export const useDeleteFileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectKey,
      filename,
    }: {
      projectKey: string;
      filename: string;
    }) => settingsService.deleteFile(projectKey, filename),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: SETTINGS_KEYS.byProject(variables.projectKey),
      });
    },
  });
};

// ── Preference keys & hooks ───────────────────────────────────

export const PREFERENCE_KEYS = {
  all: ["preferences"] as const,
  byProject: (projectKey: string) =>
    [...PREFERENCE_KEYS.all, projectKey] as const,
};

export const usePreferenceQuery = (projectKey: string | undefined) => {
  return useQuery({
    queryKey: PREFERENCE_KEYS.byProject(projectKey || ""),
    queryFn: () => settingsService.getPreference(projectKey!),
    enabled: !!projectKey,
    retry: false,
  });
};

export const useCreatePreferenceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectKey,
      data,
    }: {
      projectKey: string;
      data: CreatePreferenceRequest;
    }) => settingsService.createPreference(projectKey, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PREFERENCE_KEYS.byProject(variables.projectKey),
      });
    },
  });
};

export const useUpdatePreferenceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectKey,
      data,
    }: {
      projectKey: string;
      data: UpdatePreferenceRequest;
    }) => settingsService.updatePreference(projectKey, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PREFERENCE_KEYS.byProject(variables.projectKey),
      });
    },
  });
};
