// Chat types

export type MessageRole =
  | "user"
  | "agent"
  | "system"
  | "tool"
  | "analysis_progress"
  | "agent_function_call"
  | "error";

export interface ChatSessionCreateRequest {
  connection_id: string;
  project_key: string;
  user_message: string;
  story_key?: string;
}

export interface ChatMessageDto {
  id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface ChatSessionSummary {
  id: string;
  project_key: string;
  story_key?: string;
  created_at: string;
}

export interface ChatSessionDto extends ChatSessionSummary {
  messages: ChatMessageDto[];
}

export interface MessageChunk {
  id: string;
  role: MessageRole;
  content: string;
}
