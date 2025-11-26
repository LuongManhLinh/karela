export interface AnalysisSummary {
  id: string;
  status?: string;
  type?: string;
  project_key?: string;
  story_key?: string;
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

export interface AnalysisDetailDto extends AnalysisSummary {
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
