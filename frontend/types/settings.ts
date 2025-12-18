// Settings types

export interface SettingsDto {
  id: string;
  connection_id: string;
  project_key: string;
  product_vision?: string;
  product_scope?: string;
  current_sprint_goals?: string;
  glossary?: string;
  additional_docs?: Record<string, any>;
  llm_guidelines?: string;
  updated_at: string;
}

export interface CreateSettingsRequest {
  connection_id: string;
  project_key: string;
  product_vision?: string;
  product_scope?: string;
  current_sprint_goals?: string;
  glossary?: string;
  additional_docs?: Record<string, any>;
  llm_guidelines?: string;
}

export interface UpdateSettingsRequest {
  product_vision?: string;
  product_scope?: string;
  current_sprint_goals?: string;
  glossary?: string;
  additional_docs?: Record<string, any>;
  llm_guidelines?: string;
}
