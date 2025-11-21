import apiClient from "./api";
import type {
  BasicResponse,
  AnalysisSummary,
  AnalysisDetailDto,
  AnalysisRunRequest,
} from "@/types";

export const defectService = {
  getAnalysisSummaries: async (
    connectionId: string
  ): Promise<BasicResponse<AnalysisSummary[]>> => {
    const response = await apiClient.get<BasicResponse<AnalysisSummary[]>>(
      `/defects/analyses/connections/${connectionId}`
    );
    return response.data;
  },

  getAnalysisDetails: async (
    analysisId: string
  ): Promise<BasicResponse<AnalysisDetailDto>> => {
    const response = await apiClient.get<BasicResponse<AnalysisDetailDto>>(
      `/defects/analyses/${analysisId}/details`
    );
    return response.data;
  },

  runAnalysis: async (
    connectionId: string,
    projectKey: string,
    data: AnalysisRunRequest
  ): Promise<BasicResponse<string>> => {
    const response = await apiClient.post<BasicResponse<string>>(
      `/defects/analyses/connections/${connectionId}/${projectKey}`,
      data
    );
    return response.data;
  },

  getAnalysisStatus: async (
    analysisId: string
  ): Promise<BasicResponse<string>> => {
    const response = await apiClient.get<BasicResponse<string>>(
      `/defects/analyses/${analysisId}/status`
    );
    return response.data;
  },

  markDefectAsSolved: async (
    defectId: string,
    flag: number
  ): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      `/defects/${defectId}/solve/${flag}`
    );
    return response.data;
  },
};
