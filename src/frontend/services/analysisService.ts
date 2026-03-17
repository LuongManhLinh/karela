import apiClient from "./api";
import type { BasicResponse } from "@/types";
import type {
  AnalysisSummary,
  AnalysisDto,
  RunAnalysisRequest,
  AnalysesStatusesResponse as AnalysisStatusesResponse,
  AnalysesStatusesRequest as AnalysisStatusesRequest,
  DefectDto,
  RunAnalysisResponse,
} from "@/types/analysis";

export const analysisService = {
  getAnalysisSummariesByConnection: async (): Promise<
    BasicResponse<AnalysisSummary[]>
  > => {
    const response =
      await apiClient.get<BasicResponse<AnalysisSummary[]>>(`/analyses/`);
    return response.data;
  },
  getAnalysisSummariesByProject: async (
    projectKey: string,
  ): Promise<BasicResponse<AnalysisSummary[]>> => {
    const response = await apiClient.get<BasicResponse<AnalysisSummary[]>>(
      `/analyses/projects/${projectKey}`,
    );
    return response.data;
  },
  getAnalysisSummariesByStory: async (
    projectKey: string,
    storyKey: string,
  ): Promise<BasicResponse<AnalysisSummary[]>> => {
    const response = await apiClient.get<BasicResponse<AnalysisSummary[]>>(
      `/analyses/projects/${projectKey}/stories/${storyKey}`,
    );
    return response.data;
  },

  getAnalysisDetails: async (
    analysisIdOrKey: string,
  ): Promise<BasicResponse<AnalysisDto>> => {
    const response = await apiClient.get<BasicResponse<AnalysisDto>>(
      `/analyses/items/${analysisIdOrKey}`,
    );
    return response.data;
  },

  getDefectsForAnalysis: async (
    analysisId: string,
  ): Promise<BasicResponse<DefectDto[]>> => {
    const response = await apiClient.get<BasicResponse<DefectDto[]>>(
      `/analyses/${analysisId}/defects`,
    );
    return response.data;
  },

  runAnalysis: async (
    projectKey: string,
    data: RunAnalysisRequest,
  ): Promise<BasicResponse<RunAnalysisResponse>> => {
    const response = await apiClient.post<BasicResponse<RunAnalysisResponse>>(
      `/analyses/projects/${projectKey}`,
      data,
    );
    return response.data;
  },

  getAnalysisStatus: async (
    analysisId: string,
  ): Promise<BasicResponse<string>> => {
    const response = await apiClient.get<BasicResponse<string>>(
      `/analyses/${analysisId}/status`,
    );
    return response.data;
  },

  markDefectAsSolved: async (
    defectId: string,
    flag: number,
  ): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      `/analyses/defects/${defectId}/solve/${flag}`,
    );
    return response.data;
  },

  generateProposalsFromAnalysis: async (
    analysisId: string,
  ): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      `/analyses/${analysisId}/generate-proposals`,
    );
    return response.data;
  },

  rerunAnalysis: async (analysisId: string): Promise<BasicResponse<string>> => {
    const response = await apiClient.post<BasicResponse<string>>(
      `/analyses/${analysisId}/rerun`,
    );
    return response.data;
  },
  getAnalysisStatuses: async (
    analysisIds: string[],
  ): Promise<BasicResponse<AnalysisStatusesResponse>> => {
    const response = await apiClient.post<
      BasicResponse<AnalysisStatusesResponse>
    >(`/analyses/statuses`, {
      analysis_ids: analysisIds,
    } as AnalysisStatusesRequest);
    return response.data;
  },
  listDefectsByStory: async (
    projectKey: string,
    storyKey: string,
  ): Promise<BasicResponse<DefectDto[]>> => {
    const response = await apiClient.get<BasicResponse<DefectDto[]>>(
      `/analyses/projects/${projectKey}/stories/${storyKey}/defects`,
    );
    return response.data;
  },
};
