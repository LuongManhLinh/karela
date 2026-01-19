import apiClient from "./api";
import type { BasicResponse } from "@/types";
import {
  ConnectionSyncStatusDto,
  ProjectDto,
  StoryDto,
  StorySummary,
} from "@/types/connection";
import type { UserConnections } from "@/types/user";
import type {
  RegisterUserRequest,
  AuthenticateUserRequest,
  UserDto,
  ChangePasswordRequest,
} from "@/types/user";

export const userService = {
  register: async (data: RegisterUserRequest): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      "/users/register",
      data,
    );
    return response.data;
  },

  authenticate: async (
    data: AuthenticateUserRequest,
  ): Promise<BasicResponse<string>> => {
    const response = await apiClient.post<BasicResponse<string>>(
      "/users/",
      data,
    );
    return response.data;
  },

  getCurrentUser: async (): Promise<BasicResponse<UserDto>> => {
    const response = await apiClient.get<BasicResponse<UserDto>>("/users/");
    return response.data;
  },

  changePassword: async (
    data: ChangePasswordRequest,
  ): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      "/users/change-password",
      data,
    );
    return response.data;
  },
};
