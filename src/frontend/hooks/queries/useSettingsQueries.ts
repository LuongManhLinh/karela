import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";
import type { 
  CreateSettingsRequest, 
  UpdateSettingsRequest 
} from "@/types/settings";

export const SETTINGS_KEYS = {
  all: ["settings"] as const,
  byProject: (connectionId: string, projectKey: string) => [...SETTINGS_KEYS.all, connectionId, projectKey] as const,
};

export const useSettingsQuery = (connectionId: string | undefined, projectKey: string | undefined) => {
  return useQuery({
    queryKey: SETTINGS_KEYS.byProject(connectionId || "", projectKey || ""),
    queryFn: () => settingsService.getSettings(connectionId!, projectKey!),
    enabled: !!connectionId && !!projectKey,
    retry: false, // Don't retry if 404 (not found) which is valid state for settings
  });
};

export const useCreateSettingsMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ connectionId, projectKey, data }: { connectionId: string; projectKey: string; data: CreateSettingsRequest }) => 
        settingsService.createSettings(connectionId, projectKey, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.byProject(variables.connectionId, variables.projectKey) });
      },
    });
  };

export const useUpdateSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ connectionId, projectKey, data }: { connectionId: string; projectKey: string; data: UpdateSettingsRequest }) => 
      settingsService.updateSettings(connectionId, projectKey, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.byProject(variables.connectionId, variables.projectKey) });
    },
  });
};
