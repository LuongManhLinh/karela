export interface ConnectionDto {
  id: string;
  cloud_id: string;
  name: string;
  url?: string;
  avatar_url?: string;
  num_projects?: number;
}

export interface ProjectDto {
  id: string;
  key: string;
  name?: string;
  avatar_url?: string;
  num_stories?: number;
}

export interface ProjectDtoSync {
  id: string;
  key: string;
  name?: string;
  avatar_url?: string;
  synced: boolean;
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

export type SyncStatus =
  | "not_started"
  | "setting_up"
  | "setup_failed"
  | "setup_done"
  | "pending"
  | "in_progress"
  | "done"
  | "failed";

export interface ConnectionSyncStatusDto {
  sync_status: SyncStatus;
  sync_message?: string;
  sync_error?: ConnectionSyncError;
}

export interface DashboardDto {
  num_analyses: number;
  num_proposals: number;
  num_acs: number;
}

export interface ProjectDashboardDto extends DashboardDto {
  num_chats: number;
  num_stories: number;
  stories_with_analyses: StorySummary[];
  stories_with_proposals: StorySummary[];
  stories_with_acs: StorySummary[];
  ready_stories: StorySummary[];
  readiness_score: number;
}

export interface StoryDashboardDto extends DashboardDto {}

export interface ConnectionDashboardDto extends DashboardDto {
  num_chats: number;
  num_projects: number;
  projects_with_analyses: ProjectDto[];
  projects_with_chats: ProjectDto[];
  projects_with_proposals: ProjectDto[];
  projects_with_acs: ProjectDto[];
}

export interface SyncProjectsRequests {
  project_keys: string[];
  run_analysis_after_sync: boolean;
}
