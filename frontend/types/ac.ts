export interface GherkinAC {
  id: string;
  content: string;
  jira_issue_key?: string;
  jira_story_id: string;
  created_at: string;
  updated_at: string;
}

export interface ACCreate {
  content: string;
  jira_story_id: string;
}

export interface ACUpdate {
  content?: string;
  jira_issue_key?: string;
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
