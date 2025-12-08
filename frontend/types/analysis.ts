import { SessionSummary } from ".";

export type AnalysisStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "DONE"
  | "FAILED"
  | "UNKNOWN";
export type AnalysisType = "ALL" | "TARGETED";
export type DefectSeverity = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
export type DefectType =
  | "CONFLICT"
  | "DUPLICATION"
  | "OUT_OF_SCOPE"
  | "IRRELEVANCE"
  | "UNKNOWN";

export interface AnalysisSummary extends SessionSummary {
  status: AnalysisStatus;
  type: AnalysisType;
  ended_at?: string;
}

export interface DefectDto {
  id: string;
  key: string;
  type?: DefectType;
  severity?: DefectSeverity;
  explanation?: string;
  confidence?: number;
  suggested_fix?: string;
  solved?: boolean;
  story_keys?: string[];
}

export interface AnalysisDto extends AnalysisSummary {
  defects: DefectDto[];
}

export interface RunAnalysisRequest {
  analysis_type?: "ALL" | "TARGETED";
  target_story_key?: string;
}

export interface RunAnalysisResponse {
  id: string;
  key: string;
}

export interface AnalysesStatusesRequest {
  analysis_ids: string[];
}

export type AnalysesStatusesResponse = {
  [key: string]: AnalysisStatus;
};
