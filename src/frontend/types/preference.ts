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
