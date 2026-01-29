import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { proposalService } from "@/services/proposalService";
import type { ProposalActionFlag } from "@/types/proposal";

export const PROPOSAL_KEYS = {
  all: ["proposals"] as const,
  bySession: (
    sessionId: string,
    connectionName: string,
    projectFilterKey?: string,
    storyFilterKey?: string,
  ) =>
    [
      ...PROPOSAL_KEYS.all,
      "session",
      sessionId,
      connectionName,
      projectFilterKey,
      storyFilterKey,
    ] as const,
  item: (proposalId: string) =>
    [...PROPOSAL_KEYS.all, "item", proposalId] as const,
  byConnection: (connectionName: string) =>
    [...PROPOSAL_KEYS.all, "connection", connectionName] as const,
  byProject: (connectionName: string, projectKey: string) =>
    [...PROPOSAL_KEYS.all, "project", connectionName, projectKey] as const,
  byStory: (connectionName: string, projectKey: string, storyKey: string) =>
    [
      ...PROPOSAL_KEYS.all,
      "story",
      connectionName,
      projectKey,
      storyKey,
    ] as const,
};

export const useSessionProposalsQuery = (
  sessionIdOrKey: string | undefined,
  source: "CHAT" | "ANALYSIS" = "CHAT",
  connectionName: string | undefined,
  projectFilterKey: string | undefined,
  storyFilterKey: string | undefined,
) => {
  return useQuery({
    queryKey: PROPOSAL_KEYS.bySession(
      sessionIdOrKey || "",
      connectionName || "",
      projectFilterKey || "",
      storyFilterKey || "",
    ),
    queryFn: () =>
      proposalService.getProposalsBySession(
        sessionIdOrKey!,
        source,
        connectionName!,
        projectFilterKey,
        storyFilterKey,
      ),
    enabled: !!sessionIdOrKey && !!connectionName,
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
export const useConnectionProposalsQuery = (
  connectionName: string | undefined,
) => {
  return useQuery({
    queryKey: PROPOSAL_KEYS.byConnection(connectionName || ""),
    queryFn: () => proposalService.listProposalsByConnection(connectionName!),
    enabled: !!connectionName,
  });
};

export const useProjectProposalsQuery = (
  connectionName: string | undefined,
  projectKey: string | undefined,
) => {
  return useQuery({
    queryKey: PROPOSAL_KEYS.byProject(connectionName || "", projectKey || ""),
    queryFn: () =>
      proposalService.listProposalsByProject(connectionName!, projectKey!),
    enabled: !!connectionName && !!projectKey,
  });
};

export const useStoryProposalsQuery = (
  connectionName: string | undefined,
  projectKey: string | undefined,
  storyKey: string | undefined,
) => {
  return useQuery({
    queryKey: PROPOSAL_KEYS.byStory(
      connectionName || "",
      projectKey || "",
      storyKey || "",
    ),
    queryFn: () =>
      proposalService.listProposalsByStory(
        connectionName!,
        projectKey!,
        storyKey!,
      ),
    enabled: !!connectionName && !!projectKey && !!storyKey,
  });
};
