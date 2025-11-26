import apiClient from "./api";
import type { BasicResponse } from "@/types";
import type {
  ProposalActionFlag,
  ProposalDto,
  ProposalSource,
} from "@/types/proposal";

export const proposalService = {
  getProposal: async (
    proposalId: string
  ): Promise<BasicResponse<ProposalDto>> => {
    const response = await apiClient.get<BasicResponse<ProposalDto>>(
      `/proposals/${proposalId}`
    );
    return response.data;
  },

  getProposalsByConnection: async (
    connectionId: string
  ): Promise<BasicResponse<ProposalDto[]>> => {
    const response = await apiClient.get<BasicResponse<ProposalDto[]>>(
      `/proposals/connections/${connectionId}`
    );
    return response.data;
  },

  getProposalsBySession: async (
    sessionId: string,
    source: ProposalSource
  ): Promise<BasicResponse<ProposalDto[]>> => {
    const response = await apiClient.get<BasicResponse<ProposalDto[]>>(
      `/proposals/sessions/${sessionId}`,
      {
        params: { source },
      }
    );
    return response.data;
  },

  actOnProposal: async (
    proposalId: string,
    flag: ProposalActionFlag
  ): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      `/proposals/${proposalId}/${flag}`
    );
    return response.data;
  },

  actOnProposalContent: async (
    proposalId: string,
    contentId: string,
    flag: ProposalActionFlag
  ): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse>(
      `/proposals/contents/${contentId}/${flag}`,
      undefined,
      {
        params: { proposal_id: proposalId },
      }
    );
    return response.data;
  },
};
