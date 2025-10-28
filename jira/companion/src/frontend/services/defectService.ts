import { invoke, view } from "@forge/bridge";
import { ApiResponse } from "../types/apiResponse";
import {
  AnalysisBrief,
  AnalysisDetailDto,
  AnalysisStatus,
} from "../types/defect";

const DefectService = {
  analyzeDefects: async (): Promise<ApiResponse<{ analysisId: string }>> => {
    const context = await view.getContext();

    const result = await invoke("analyzeDefect", {
      projectKey: context.extension.project.key || "---",
    });
    // const result = { data: null, error: "Not implemented" };
    return result as ApiResponse<{ analysisId: string }>;
  },
  getAllDefectAnalysisBriefs: async (): Promise<
    ApiResponse<AnalysisBrief[]>
  > => {
    const result = await invoke("getAllDefectAnalysisBriefs", {});
    return result as ApiResponse<AnalysisBrief[]>;
  },
  getDefectAnalysisStatus: async (
    analysisId: string
  ): Promise<ApiResponse<AnalysisStatus>> => {
    const result = await invoke("getDefectAnalysisStatus", { analysisId });
    return result as ApiResponse<AnalysisStatus>;
  },
  getDefectAnalysisDetails: async (
    analysisId: string
  ): Promise<ApiResponse<AnalysisDetailDto>> => {
    const result = await invoke("getDefectAnalysisDetails", { analysisId });
    return result as ApiResponse<AnalysisDetailDto>;
  },
};

export default DefectService;
