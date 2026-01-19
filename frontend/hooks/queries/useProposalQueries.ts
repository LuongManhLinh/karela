import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { proposalService } from "@/services/proposalService";
import type { ProposalActionFlag } from "@/types/proposal";

export const PROPOSAL_KEYS = {
  all: ["proposals"] as const,
  bySession: (sessionId: string) =>
    [...PROPOSAL_KEYS.all, "session", sessionId] as const,
  item: (proposalId: string) =>
    [...PROPOSAL_KEYS.all, "item", proposalId] as const,
  byProject: (connectionId: string, projectKey: string) =>
    [...PROPOSAL_KEYS.all, "project", connectionId, projectKey] as const,
  byStory: (connectionId: string, projectKey: string, storyKey: string) =>
    [
      ...PROPOSAL_KEYS.all,
      "story",
      connectionId,
      projectKey,
      storyKey,
    ] as const,
};

export const useSessionProposalsQuery = (
  sessionId: string | undefined,
  source: "CHAT" | "ANALYSIS" = "CHAT",
  storyKey?: string,
) => {
  return useQuery({
    queryKey: PROPOSAL_KEYS.bySession(sessionId || ""),
    queryFn: () =>
      proposalService.getProposalsBySession(sessionId!, source, storyKey),
    enabled: !!sessionId,
  });
};

export const useProposalQuery = (proposalId: string | undefined) => {
  return useQuery({
    queryKey: PROPOSAL_KEYS.item(proposalId || ""),
    queryFn: () => proposalService.getProposal(proposalId!),
    enabled: !!proposalId,
  });
};

export const useActOnProposalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      proposalId,
      flag,
    }: {
      proposalId: string;
      flag: ProposalActionFlag;
    }) => proposalService.actOnProposal(proposalId, flag),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PROPOSAL_KEYS.item(variables.proposalId),
      });
      // Invalidate session proposals too as their status might change
      queryClient.invalidateQueries({ queryKey: PROPOSAL_KEYS.all });
    },
  });
};

export const useActOnProposalContentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      proposalId,
      contentId,
      flag,
    }: {
      proposalId: string;
      contentId: string;
      flag: ProposalActionFlag;
    }) => proposalService.actOnProposalContent(proposalId, contentId, flag),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PROPOSAL_KEYS.item(variables.proposalId),
      });
      queryClient.invalidateQueries({ queryKey: PROPOSAL_KEYS.all });
    },
  });
};

export const useProjectProposalsQuery = (
  connectionId: string | undefined,
  projectKey: string | undefined,
) => {
  return useQuery({
    queryKey: PROPOSAL_KEYS.byProject(connectionId || "", projectKey || ""),
    queryFn: () =>
      proposalService.listProposalsByProject(connectionId!, projectKey!),
    enabled: !!connectionId && !!projectKey,
  });
};

export const useStoryProposalsQuery = (
  connectionId: string | undefined,
  projectKey: string | undefined,
  storyKey: string | undefined,
) => {
  return useQuery({
    queryKey: PROPOSAL_KEYS.byStory(
      connectionId || "",
      projectKey || "",
      storyKey || "",
    ),
    queryFn: () =>
      proposalService.listProposalsByStory(
        connectionId!,
        projectKey!,
        storyKey!,
      ),
    enabled: !!connectionId && !!projectKey && !!storyKey,
  });
};
