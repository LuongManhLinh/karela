import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";
import type {
  CreateSettingsRequest,
  UpdateSettingsRequest,
} from "@/types/settings";

export const SETTINGS_KEYS = {
  all: ["settings"] as const,
  byProject: (projectKey: string) =>
    [...SETTINGS_KEYS.all, projectKey] as const,
};

export const useSettingsQuery = (projectKey: string | undefined) => {
  return useQuery({
    queryKey: SETTINGS_KEYS.byProject(projectKey || ""),
    queryFn: () => settingsService.getSettings(projectKey!),
    enabled: !!projectKey,
    retry: false, // Don't retry if 404 (not found) which is valid state for settings
  });
};

export const useCreateSettingsMutation = () => {
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

export const useUpdateSettingsMutation = () => {
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
