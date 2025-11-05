export interface AnalysisId {
  analysisId: string;
}

export interface AnalysisBrief {
  id: string;
  title: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  type: string;
}

export interface AnalysisStatus {
  status: string;
}

export interface AnalysisDetailDto {
  id: string;
  summary: string;
  defects: DefectDto[];
}

export interface DefectDto {
  id: string;
  type: string;
  severity: string;
  explanation: string;
  confidence: number;
  suggestedFix: string;
  solved: boolean;
  workItemIds: string[];
}
