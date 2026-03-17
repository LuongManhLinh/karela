import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { proposalService } from "@/services/proposalService";
import type { ProposalActionFlag } from "@/types/proposal";

export const PROPOSAL_KEYS = {
  all: ["proposals"] as const,
  bySession: (
    sessionId: string,
    projectFilterKey?: string,
    storyFilterKey?: string,
  ) =>
    [
      ...PROPOSAL_KEYS.all,
      "session",
      sessionId,
      projectFilterKey,
      storyFilterKey,
    ] as const,
  item: (proposalId: string) =>
    [...PROPOSAL_KEYS.all, "item", proposalId] as const,
  byConnection: () => [...PROPOSAL_KEYS.all, "connection"] as const,
  byProject: (projectKey: string) =>
    [...PROPOSAL_KEYS.all, "project", projectKey] as const,
  byStory: (projectKey: string, storyKey: string) =>
    [...PROPOSAL_KEYS.all, "story", projectKey, storyKey] as const,
};

export const useSessionProposalsQuery = (
  sessionIdOrKey: string | undefined,
  source: "CHAT" | "ANALYSIS" = "CHAT",
  projectFilterKey: string | undefined,
  storyFilterKey: string | undefined,
) => {
  return useQuery({
    queryKey: PROPOSAL_KEYS.bySession(
      sessionIdOrKey || "",
      projectFilterKey || "",
      storyFilterKey || "",
    ),
    queryFn: () =>
      proposalService.getProposalsBySession(
        sessionIdOrKey!,
        source,
        projectFilterKey,
        storyFilterKey,
      ),
    enabled: !!sessionIdOrKey,
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
export const useConnectionProposalsQuery = () => {
  return useQuery({
    queryKey: PROPOSAL_KEYS.byConnection(),
    queryFn: () => proposalService.listProposalsByConnection(),
  });
};

export const useProjectProposalsQuery = (projectKey: string | undefined) => {
  return useQuery({
    queryKey: PROPOSAL_KEYS.byProject(projectKey || ""),
    queryFn: () => proposalService.listProposalsByProject(projectKey!),
    enabled: !!projectKey,
  });
};

export const useStoryProposalsQuery = (
  projectKey: string | undefined,
  storyKey: string | undefined,
) => {
  return useQuery({
    queryKey: PROPOSAL_KEYS.byStory(projectKey || "", storyKey || ""),
    queryFn: () => proposalService.listProposalsByStory(projectKey!, storyKey!),
    enabled: !!projectKey && !!storyKey,
  });
};
