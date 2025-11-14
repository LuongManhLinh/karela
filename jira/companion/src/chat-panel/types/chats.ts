import { AnalysisStatus } from "../../common/analysisStatus";

// Types adapted from backend schemas.py
export type ChatRole = "user" | "ai" | "system" | "tool" | "analysis_progress";

export interface ChatMessageDto {
  id: number;
  role: ChatRole;
  content: string;
  created_at: string;
}

export interface AnalysisProgressMessageDto extends ChatMessageDto {
  analysis_id: string;
  status: AnalysisStatus;
}

export interface ChatProposalContentDto {
  story_key: string;
  summary?: string;
  description?: string;
}

export type ProposalType = "CREATE" | "UPDATE" | "UNKNOWN";

export interface ChatProposalDto {
  id: string;
  session_id: string;
  project_key: string;
  type: ProposalType;
  accepted?: boolean | null;
  created_at: string;
  contents: ChatProposalContentDto[];
}

export interface ChatSessionDto {
  id: string;
  project_key: string;
  story_key?: string | null;
  created_at: string;
  messages: (ChatMessageDto | AnalysisProgressMessageDto)[];
  change_proposals: ChatProposalDto[];
}

export interface MessagePostResponse {
  message_id: number;
  message_created_at: string;
}

export interface CreateSessionResponse extends MessagePostResponse {
  session_id: string;
}
