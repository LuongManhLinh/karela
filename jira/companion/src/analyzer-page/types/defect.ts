import { AnalysisStatus } from "../../common/analysisStatus";

export interface AnalysisSummary {
  id: string;
  status: AnalysisStatus;
  started_at: string;
  ended_at: string | null;
  type: string;
}

export interface AnalysisDetailDto {
  id: string;
  defects: DefectDto[];
}

export interface DefectDto {
  id: string;
  type: string;
  severity: string;
  explanation: string;
  confidence: number;
  suggested_fix: string;
  solved: boolean;
  work_item_keys: string[];
}
