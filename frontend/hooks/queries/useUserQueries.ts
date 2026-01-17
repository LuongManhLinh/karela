import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import type {
  RegisterUserRequest,
  AuthenticateUserRequest,
  ChangePasswordRequest,
} from "@/types/user";
import { connectionService } from "@/services/connectionService";

export const USER_KEYS = {
  all: ["user"] as const,
  currentUser: () => [...USER_KEYS.all, "current"] as const,
  connections: () => [...USER_KEYS.all, "connections"] as const,
  projects: (connectionId: string) =>
    [...USER_KEYS.all, "projects", connectionId] as const,
  storySummaries: (connectionId: string, projectKey: string) =>
    [...USER_KEYS.all, "stories", connectionId, projectKey] as const,
  syncStatus: (connectionId: string) =>
    [...USER_KEYS.all, "syncStatus", connectionId] as const,
};

export const useConnectionSyncStatusQuery = (connectionId: string) => {
  return useQuery({
    queryKey: USER_KEYS.syncStatus(connectionId),
    queryFn: () => connectionService.getConnectionSyncStatus(connectionId),
    refetchInterval: (query) => {
      const status = query.state.data?.data?.sync_status;
      const error = query.state.data?.data?.sync_error;
      // Poll if not SYNCED and no error
      if (status && status !== "SYNCED" && !error) {
        return 1000;
      }
      return false;
    },
  });
};

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: (data: RegisterUserRequest) => userService.register(data),
  });
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AuthenticateUserRequest) =>
      userService.authenticate(data),
    onSuccess: () => {
      // Invalidate queries or additional logic if needed
      queryClient.invalidateQueries({ queryKey: USER_KEYS.currentUser() });
    },
  });
};

export const useCurrentUserQuery = () => {
  return useQuery({
    queryKey: USER_KEYS.currentUser(),
    queryFn: () => userService.getCurrentUser(),
    retry: false, // Don't retry if 401/unauthorized
  });
};

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      userService.changePassword(data),
  });
};

export const useUserConnectionsQuery = () => {
  return useQuery({
    queryKey: USER_KEYS.connections(),
    queryFn: () => connectionService.getUserConnections(),
  });
};

export const useProjectKeysQuery = (connectionId: string | undefined) => {
  return useQuery({
    queryKey: USER_KEYS.projects(connectionId || ""),
    queryFn: () => connectionService.getProjects(connectionId!),
    enabled: !!connectionId,
  });
};

export const useStoryKeysQuery = (
  connectionId: string | undefined,
  projectKey: string | undefined
) => {
  return useQuery({
    queryKey: USER_KEYS.storySummaries(connectionId || "", projectKey || ""),
    queryFn: () =>
      connectionService.getStorySummaries(connectionId!, projectKey!),
    enabled: !!connectionId && !!projectKey,
  });
};
