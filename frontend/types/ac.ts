export interface ACSummary {
  id: string;
  key?: string;
  story_key: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

export interface ACDto extends ACSummary {
  description: string;
}

export interface AISuggestion {
  suggestions: string;
  explanation: string;
}

export interface AIResponse {
  suggestions: AISuggestion[];
}
