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
