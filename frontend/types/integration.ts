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
}

export interface StorySummary {
  id: string;
  key: string;
  summary?: string;
}
