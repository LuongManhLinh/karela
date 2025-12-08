// Defect types

import { SessionSummary } from ".";

export interface ProposalContentDto {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE" | "UNKNOWN";
  story_key?: string | null;
  summary?: string | null;
  description?: string | null;
  accepted?: boolean | null;
  explanation?: string | null;
}

export type ProposalSource = "CHAT" | "ANALYSIS";
export type ProposalActionFlag = -1 | 0 | 1;

export interface ProposalSummary {
  id: string;
  key: string;
  session_id: string;
  project_key: string;
  created_at: string;
}

export interface ProposalDto extends ProposalSummary {
  source: ProposalSource;
  target_defect_keys?: string[] | null;
  contents: ProposalContentDto[];
}

export interface SessionsHavingProposals {
  analysis_sessions: SessionSummary[];
  chat_sessions: SessionSummary[];
}
