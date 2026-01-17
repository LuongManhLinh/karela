export interface JiraConnectionDto {
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
