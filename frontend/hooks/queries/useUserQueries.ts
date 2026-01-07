import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import type {
  RegisterUserRequest,
  AuthenticateUserRequest,
  ChangePasswordRequest,
} from "@/types/user";

export const USER_KEYS = {
  all: ["user"] as const,
  currentUser: () => [...USER_KEYS.all, "current"] as const,
  connections: () => [...USER_KEYS.all, "connections"] as const,
  projectKeys: (connectionId: string) =>
    [...USER_KEYS.all, "projects", connectionId] as const,
  issueKeys: (connectionId: string, projectKey: string) =>
    [...USER_KEYS.all, "issues", connectionId, projectKey] as const,
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
    queryFn: () => userService.getUserConnections(),
  });
};

export const useProjectKeysQuery = (connectionId: string | undefined) => {
  return useQuery({
    queryKey: USER_KEYS.projectKeys(connectionId || ""),
    queryFn: () => userService.getProjectKeys(connectionId!),
    enabled: !!connectionId,
  });
};

export const useIssueKeysQuery = (
  connectionId: string | undefined,
  projectKey: string | undefined
) => {
  return useQuery({
    queryKey: USER_KEYS.issueKeys(connectionId || "", projectKey || ""),
    queryFn: () => userService.getIssueKeys(connectionId!, projectKey!),
    enabled: !!connectionId && !!projectKey,
  });
};
