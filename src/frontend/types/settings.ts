// Settings types

export interface AdditionalDocDto {
  title: string;
  content: string;
  description?: string;
}

export interface AdditionalFileDto {
  filename: string;
  url: string;
  description?: string;
}

export interface SettingsDto {
  id: string;
  connection_id: string;
  project_key: string;
  product_vision?: string;
  product_scope?: string;
  current_sprint_goals?: string;
  glossary?: string;
  additional_docs?: AdditionalDocDto[];
  additional_files?: AdditionalFileDto[];
  updated_at: string;
}

export interface CreateSettingsRequest {
  product_vision?: string;
  product_scope?: string;
  current_sprint_goals?: string;
  glossary?: string;
  additional_docs?: AdditionalDocDto[];
  additional_files?: AdditionalFileDto[];
}

export interface UpdateSettingsRequest {
  product_vision?: string;
  product_scope?: string;
  current_sprint_goals?: string;
  glossary?: string;
  additional_docs?: AdditionalDocDto[];
  additional_files?: AdditionalFileDto[];
}

// Preference types

export interface PreferenceDto {
  id: string;
  connection_id: string;
  project_key: string;
  run_analysis_guidelines?: string;
  gen_proposal_guidelines?: string;
  gen_proposal_after_analysis: boolean;
  gen_proposal_mode?: string;
  gen_language?: string;
  chat_guidelines?: string;
  updated_at: string;
}

export interface CreatePreferenceRequest {
  run_analysis_guidelines?: string;
  gen_proposal_guidelines?: string;
  gen_proposal_after_analysis?: boolean;
  gen_proposal_mode?: string;
  gen_language?: string;
  chat_guidelines?: string;
}

export interface UpdatePreferenceRequest {
  run_analysis_guidelines?: string;
  gen_proposal_guidelines?: string;
  gen_proposal_after_analysis?: boolean;
  gen_proposal_mode?: string;
  gen_language?: string;
  chat_guidelines?: string;
}
