// Common types
export interface BasicResponse<T = any> {
  detail?: string;
  data?: T;
  errors?: any[];
}

// User types
export interface RegisterUserRequest {
  username: string;
  password: string;
  email?: string;
}

export interface AuthenticateUserRequest {
  username_or_email: string;
  password: string;
}

export interface UserDto {
  username: string;
  email?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface JiraConnectionDto {
  id: string;
  cloud_id: string;
  name?: string;
  url?: string;
  avatar_url?: string;
}

export interface UserConnections {
  jira_connections: JiraConnectionDto[];
  azure_devops_connections: any[];
}

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

export interface AnalysisProgressMessageContent {
  analysis_id: string;
  status: string;
}

export interface ChatMessageDto {
  id: string;
  role: MessageRole;
  content: string | AnalysisProgressMessageContent;
  created_at: string;
}

export interface ChatProposalContentDto {
  story_key: string;
  summary?: string;
  description?: string;
}

export interface ChatProposalDto {
  id: string;
  session_id: string;
  project_key: string;
  type: "CREATE" | "UPDATE" | "UNKNOWN";
  accepted?: boolean | null;
  created_at: string;
  contents: ChatProposalContentDto[];
}

export interface ChatSessionSummary {
  id: string;
  project_key: string;
  story_key?: string;
  created_at: string;
}

export interface ChatSessionDto extends ChatSessionSummary {
  messages: ChatMessageDto[];
  change_proposals: ChatProposalDto[];
}

export interface MessageChunk {
  id: string;
  role: MessageRole;
  content: string;
}

// Defect types
export interface AnalysisSummary {
  id: string;
  status?: string;
  type?: string;
  started_at?: string;
  ended_at?: string;
}

export interface DefectDto {
  id: string;
  type?: string;
  severity?: string;
  explanation?: string;
  confidence?: number;
  suggested_fix?: string;
  solved?: boolean;
  work_item_keys?: string[];
}

export interface AnalysisDetailDto {
  id: string;
  defects: DefectDto[];
}

export interface AnalysisDto extends AnalysisSummary {
  story_key?: string;
  error_message?: string;
  defects?: DefectDto[];
}

export interface AnalysisRunRequest {
  analysis_type?: "ALL" | "TARGETED";
  target_story_key?: string;
}

export interface AnalysisStatus {
  status: string;
}
