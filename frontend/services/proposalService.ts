import apiClient from "./api";
import type { BasicResponse } from "@/types";
import type {
  ProposalActionFlag,
  SessionsWithProposals,
  ProposalDto,
  ProposalSource,
  ProposalContentEditRequest,
} from "@/types/proposal";

export const proposalService = {
  getProposal: async (
    proposalId: string,
  ): Promise<BasicResponse<ProposalDto>> => {
    const response = await apiClient.get<BasicResponse<ProposalDto>>(
      `/proposals/${proposalId}`,
    );
    return response.data;
  },

  listProposalsByProject: async (
    connectionId: string,
    projectKey: string,
  ): Promise<BasicResponse<SessionsWithProposals>> => {
    const response = await apiClient.get<BasicResponse<SessionsWithProposals>>(
      `/proposals/connections/${connectionId}/projects/${projectKey}`,
    );
    return response.data;
  },

  listProposalsByStory: async (
    connectionId: string,
    projectKey: string,
    storyKey: string,
  ): Promise<BasicResponse<SessionsWithProposals>> => {
    const response = await apiClient.get<BasicResponse<SessionsWithProposals>>(
      `/proposals/connections/${connectionId}/projects/${projectKey}/stories/${storyKey}`,
    );
    return response.data;
  },

  getProposalsBySession: async (
    sessionId: string,
    source: ProposalSource,
    connectionName: string,
    projectKey: string,
    storyKey?: string,
  ): Promise<BasicResponse<ProposalDto[]>> => {
    const response = await apiClient.get<BasicResponse<ProposalDto[]>>(
      `/proposals/connections/${connectionName}/projects/${projectKey}/sessions/${sessionId}`,
      {
        params: { source, story_key: storyKey },
      },
    );
    return response.data;
  },

  actOnProposal: async (
    proposalId: string,
    flag: ProposalActionFlag,
  ): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      `/proposals/${proposalId}/${flag}`,
    );
    return response.data;
  },

  actOnProposalContent: async (
    proposalId: string,
    contentId: string,
    flag: ProposalActionFlag,
  ): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      `/proposals/contents/${contentId}/${flag}`,
      undefined,
      {
        params: { proposal_id: proposalId },
      },
    );
    return response.data;
  },

  editProposalContent: async (
    proposalContentId: string,
    request: ProposalContentEditRequest,
  ): Promise<BasicResponse> => {
    const response = await apiClient.put<BasicResponse>(
      `/proposals/contents/${proposalContentId}`,
      request,
    );
    return response.data;
  },
};
