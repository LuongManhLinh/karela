import apiClient from "./api";
import type {
  BasicResponse,
  RegisterUserRequest,
  AuthenticateUserRequest,
  UserDto,
  ChangePasswordRequest,
  UserConnections,
} from "@/types";

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

  getProjectKeys: async (connId: string): Promise<BasicResponse<string[]>> => {
    const response = await apiClient.get<BasicResponse<string[]>>(
      `/users/connections/${connId}/projects`
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
};
