export type HistoryItem = {
  id: string;
  title: string;
  timestamp: string; // ISO
};

export interface SuggestionItem {
  id: string;
  text: string;
  done: boolean;
}

export type AnalysisPayload = {
  avatarInitials: string;
  analysisMessage?: string;
  markdown: string;
  suggestions: SuggestionItem[];
  history: HistoryItem[];
};

export interface DefectResponse {
  notification: string;
  report: DefectReport;
  defects: DetectDefectOutput[];
}

export interface DefectReport {
  title: string;
  content: string;
  suggestions: string[];
}

export interface DetectDefectOutput {
  defects: Defect[];
  confidence: number;
}

export interface Defect {
  type: string;
  workItemIds: string[];
  severity: string;
  explanation: string;
  suggestedImprovements: string[];
}

export type FetchResult<T> = {
  data: T | null;
  hadError: boolean;
};
