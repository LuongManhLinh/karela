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
  new_content: string;
  explanation: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  position: {
    start_row: number;
    start_column: number;
    end_row: number;
    end_column: number;
  };
}

export interface AIResponse {
  suggestions: AISuggestion[];
}
