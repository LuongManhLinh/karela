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
import { connection } from "next/server";

export const analysisService = {
  getAnalysisSummariesByProject: async (
    connectionName: string,
    projectKey: string,
  ): Promise<BasicResponse<AnalysisSummary[]>> => {
    const response = await apiClient.get<BasicResponse<AnalysisSummary[]>>(
      `/analyses/connections/${connectionName}/projects/${projectKey}`,
    );
    return response.data;
  },
  getAnalysisSummariesByStory: async (
    connectionName: string,
    projectKey: string,
    storyKey: string,
  ): Promise<BasicResponse<AnalysisSummary[]>> => {
    const response = await apiClient.get<BasicResponse<AnalysisSummary[]>>(
      `/analyses/connections/${connectionName}/projects/${projectKey}/stories/${storyKey}`,
    );
    return response.data;
  },

  getAnalysisDetails: async (
    connectionName: string,
    projectKey: string,
    analysisIdOrKey: string,
  ): Promise<BasicResponse<AnalysisDto>> => {
    const response = await apiClient.get<BasicResponse<AnalysisDto>>(
      `/analyses/connections/${connectionName}/projects/${projectKey}/analyses/${analysisIdOrKey}`,
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
    connectionId: string,
    projectKey: string,
    data: RunAnalysisRequest,
  ): Promise<BasicResponse<RunAnalysisResponse>> => {
    const response = await apiClient.post<BasicResponse<RunAnalysisResponse>>(
      `/analyses/connections/${connectionId}/projects/${projectKey}`,
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
};
