import apiClient from "./api";
import type { BasicResponse } from "@/types";
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
      data
    );
    return response.data;
  },

  authenticate: async (
    data: AuthenticateUserRequest
  ): Promise<BasicResponse<string>> => {
    const response = await apiClient.post<BasicResponse<string>>(
      "/users/",
      data
    );
    return response.data;
  },

  getCurrentUser: async (): Promise<BasicResponse<UserDto>> => {
    const response = await apiClient.get<BasicResponse<UserDto>>("/users/");
    return response.data;
  },

  changePassword: async (
    data: ChangePasswordRequest
  ): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      "/users/change-password",
      data
    );
    return response.data;
  },

  getUserConnections: async (): Promise<BasicResponse<UserConnections>> => {
    const response = await apiClient.get<BasicResponse<UserConnections>>(
      "/users/connections"
    );
    return response.data;
  },

  getProjectKeys: async (
    connectionIdOrName: string
  ): Promise<BasicResponse<string[]>> => {
    const response = await apiClient.get<BasicResponse<string[]>>(
      `/users/connections/${connectionIdOrName}/projects`
    );
    return response.data;
  },

  getIssueKeys: async (
    connId: string,
    projectKey: string
  ): Promise<BasicResponse<string[]>> => {
    const response = await apiClient.get<BasicResponse<string[]>>(
      `/users/connections/${connId}/projects/${projectKey}/issues`
    );
    return response.data;
  },

  deleteConnection: async (connectionId: string): Promise<BasicResponse> => {
    const response = await apiClient.delete<BasicResponse>(
      `/users/connections/${connectionId}`
    );
    return response.data;
  },
};
