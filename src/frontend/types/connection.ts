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

export interface ProjectSyncDto {
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

export interface StoryInfo {
  id: string;
  key: string;
  analysis_count: number;
  proposal_count: number;
  ac_count: number;
  is_ready: boolean;
}

export interface ProjectDashboardDto extends DashboardDto {
  num_chats: number;
  num_stories: number;
  readiness_score: number;
}

export interface StoryDashboardDto extends DashboardDto {}

export interface ProjectInfo {
  id: string;
  key: string;
  name?: string;
  analysis_count: number;
  chat_count: number;
  proposal_count: number;
  ac_count: number;
}

export interface ConnectionDashboardDto extends DashboardDto {
  num_chats: number;
  num_projects: number;
}

export interface SyncProject {
  key: string;
  description: string;
  run_analysis_after_sync: boolean;
}

export interface SyncProjectsRequests {
  projects: SyncProject[];
}
