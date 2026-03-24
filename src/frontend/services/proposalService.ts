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

  listProposalsByConnection: async (): Promise<
    BasicResponse<SessionsWithProposals>
  > => {
    const response =
      await apiClient.get<BasicResponse<SessionsWithProposals>>(`/proposals/`);
    return response.data;
  },

  listProposalsByProject: async (
    projectKey: string,
  ): Promise<BasicResponse<SessionsWithProposals>> => {
    const response = await apiClient.get<BasicResponse<SessionsWithProposals>>(
      `/proposals/projects/${projectKey}`,
    );
    return response.data;
  },

  listProposalsByStory: async (
    projectKey: string,
    storyKey: string,
  ): Promise<BasicResponse<SessionsWithProposals>> => {
    const response = await apiClient.get<BasicResponse<SessionsWithProposals>>(
      `/proposals/projects/${projectKey}/stories/${storyKey}`,
    );
    return response.data;
  },

  getProposalsBySession: async (
    sessionKey: string,
    source: ProposalSource,
    projectFilterKey?: string,
    storyFilterKey?: string,
  ): Promise<BasicResponse<ProposalDto[]>> => {
    const response = await apiClient.get<BasicResponse<ProposalDto[]>>(
      `/proposals/sessions/${sessionKey}`,
      {
        params: {
          source,
          project_filter_key: projectFilterKey,
          story_filter_key: storyFilterKey,
        },
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
