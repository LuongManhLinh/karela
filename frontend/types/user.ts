// User types

import { JiraConnectionDto } from "./integration";

export interface RegisterUserRequest {
  username: string;
  password: string;
  email?: string;
}

export interface AuthenticateUserRequest {
  username_or_email: string;
  password: string;
}

export interface UserDto {
  username: string;
  email?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}
export interface UserConnections {
  jira_connections: JiraConnectionDto[];
  azure_devops_connections: any[];
}
