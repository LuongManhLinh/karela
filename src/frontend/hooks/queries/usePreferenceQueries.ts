import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { preferenceService } from "@/services/preferenceService";
import type {
  CreatePreferenceRequest,
  UpdatePreferenceRequest,
} from "@/types/preference";

export const PREFERENCE_KEYS = {
  all: ["preferences"] as const,
  byProject: (projectKey: string) =>
    [...PREFERENCE_KEYS.all, projectKey] as const,
};

export const usePreferenceQuery = (projectKey: string | undefined) => {
  return useQuery({
    queryKey: PREFERENCE_KEYS.byProject(projectKey || ""),
    queryFn: () => preferenceService.getPreference(projectKey!),
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
    }) => preferenceService.createPreference(projectKey, data),
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
    }) => preferenceService.updatePreference(projectKey, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PREFERENCE_KEYS.byProject(variables.projectKey),
      });
    },
  });
};
