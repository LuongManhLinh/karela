// Defect types

export interface ProposalContentDto {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE" | "UNKNOWN";
  key?: string | null;
  summary?: string | null;
  description?: string | null;
  accepted?: boolean | null;
  explanation?: string | null;
}

export type ProposalSource = "CHAT" | "ANALYSIS";
export type ProposalActionFlag = -1 | 0 | 1;

export interface ProposalDto {
  id: string;
  source: ProposalSource;
  session_id: string;
  project_key: string;
  created_at: string;
  accepted?: boolean | null;
  contents: ProposalContentDto[];
}
