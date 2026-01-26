export interface ConnectionDto {
  id: string;
  cloud_id: string;
  name?: string;
  url?: string;
  avatar_url?: string;
}

export interface ProjectDto {
  id: string;
  key: string;
  name?: string;
  avatar_url?: string;
}

export interface StorySummary {
  id: string;
  key: string;
  summary?: string;
}

export interface StoryDto extends StorySummary {
  description?: string;
}

export type ConnectionSyncError =
  | "data_sync_error"
  | "auth_error"
  | "webhook_error"
  | "issue_type_error"
  | "issue_type_scheme_error"
  | "unknown_error";

export interface ConnectionSyncStatusDto {
  sync_status: string;
  sync_error?: ConnectionSyncError;
}

export interface DashboardDto {
  num_analyses: number;
  num_chats: number;
  num_proposals: number;
  num_acs: number;
}

export interface ProjectDashboardDto extends DashboardDto {
  num_stories: number;
  stories_with_analyses: StorySummary[];
  stories_with_chats: StorySummary[];
  stories_with_proposals: StorySummary[];
  stories_with_acs: StorySummary[];
}

export interface StoryDashboardDto extends DashboardDto {}

export interface ConnectionDashboardDto extends DashboardDto {
  num_projects: number;
  projects_with_analyses: ProjectDto[];
  projects_with_chats: ProjectDto[];
  projects_with_proposals: ProjectDto[];
  projects_with_acs: ProjectDto[];
}
