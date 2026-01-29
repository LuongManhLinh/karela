// Common types
export interface BasicResponse<T = any> {
  detail: string | null;
  data: T | null;
  errors: any[] | null;
}

export interface SessionSummary {
  id: string;
  key: string;
  project_key: string;
  story_key: string | null;
  created_at: string;
}

export type PageLevel = "connection" | "project" | "story";
