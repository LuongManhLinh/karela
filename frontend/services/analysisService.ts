import apiClient from "./api";
import type { BasicResponse } from "@/types";
import type {
  AnalysisSummary,
  AnalysisDetailDto,
  AnalysisRunRequest,
} from "@/types/analysis";

export const analysisService = {
  getAnalysisSummaries: async (
    connectionId: string
  ): Promise<BasicResponse<AnalysisSummary[]>> => {
    const response = await apiClient.get<BasicResponse<AnalysisSummary[]>>(
      `/analyses/connections/${connectionId}`
    );
    return response.data;
  },

  getAnalysisDetails: async (
    analysisId: string
  ): Promise<BasicResponse<AnalysisDetailDto>> => {
    const response = await apiClient.get<BasicResponse<AnalysisDetailDto>>(
      `/analyses/${analysisId}`
    );
    return response.data;
  },

  runAnalysis: async (
    connectionId: string,
    projectKey: string,
    data: AnalysisRunRequest
  ): Promise<BasicResponse<string>> => {
    const response = await apiClient.post<BasicResponse<string>>(
      `/analyses/connections/${connectionId}/${projectKey}`,
      data
    );
    return response.data;
  },

  getAnalysisStatus: async (
    analysisId: string
  ): Promise<BasicResponse<string>> => {
    const response = await apiClient.get<BasicResponse<string>>(
      `/analyses/${analysisId}/status`
    );
    return response.data;
  },

  markDefectAsSolved: async (
    defectId: string,
    flag: number
  ): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      `/analyses/defects/${defectId}/solve/${flag}`
    );
    return response.data;
  },

  generateProposalsFromAnalysis: async (
    analysisId: string
  ): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      `/analyses/${analysisId}/generate-proposals`
    );
    return response.data;
  },
};
