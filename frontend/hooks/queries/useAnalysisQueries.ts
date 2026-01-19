import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analysisService } from "@/services/analysisService";
import type { RunAnalysisRequest } from "@/types/analysis";

export const ANALYSIS_KEYS = {
  all: ["analysis"] as const,
  summariesByProject: (connectionId: string, projectKey: string) =>
    [...ANALYSIS_KEYS.all, "summaries", connectionId, projectKey] as const,
  summariesByStory: (
    connectionId: string,
    projectKey: string,
    storyKey: string,
  ) =>
    [
      ...ANALYSIS_KEYS.all,
      "summaries",
      connectionId,
      projectKey,
      storyKey,
    ] as const,
  details: (analysisId: string) =>
    [...ANALYSIS_KEYS.all, "details", analysisId] as const,
  statuses: (ids: string[]) =>
    [...ANALYSIS_KEYS.all, "statuses", ...ids.sort()] as const,
};

export const useAnalysisSummariesByProjectQuery = (
  connectionId: string | undefined,
  projectKey: string | undefined,
) => {
  return useQuery({
    queryKey: ANALYSIS_KEYS.summariesByProject(
      connectionId || "",
      projectKey || "",
    ),
    queryFn: () =>
      analysisService.getAnalysisSummariesByProject(connectionId!, projectKey!),
    enabled: !!connectionId && !!projectKey,
  });
};

export const useAnalysisSummariesByStoryQuery = (
  connectionId: string | undefined,
  projectKey: string | undefined,
  storyKey: string | undefined,
) => {
  return useQuery({
    queryKey: ANALYSIS_KEYS.summariesByStory(
      connectionId || "",
      projectKey || "",
      storyKey || "",
    ),
    queryFn: () =>
      analysisService.getAnalysisSummariesByStory(
        connectionId!,
        projectKey!,
        storyKey!,
      ),
    enabled: !!connectionId && !!projectKey && !!storyKey,
  });
};

export const useAnalysisDetailsQuery = (analysisIdOrKey: string | null) => {
  return useQuery({
    queryKey: ANALYSIS_KEYS.details(analysisIdOrKey || ""),
    queryFn: () => analysisService.getAnalysisDetails(analysisIdOrKey!),
    enabled: !!analysisIdOrKey,
  });
};

export const useAnalysisStatusesQuery = (ids: string[]) => {
  return useQuery({
    queryKey: ANALYSIS_KEYS.statuses(ids),
    queryFn: () => analysisService.getAnalysisStatuses(ids),
    enabled: ids.length > 0,
    refetchInterval: (query) => {
      // Stop polling if no IDs or if query error?
      // Actually usually we return interval ms.
      return 2000;
    },
  });
};

export const useRunAnalysisMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectionId,
      projectKey,
      data,
    }: {
      connectionId: string;
      projectKey: string;
      data: RunAnalysisRequest;
    }) => analysisService.runAnalysis(connectionId, projectKey, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ANALYSIS_KEYS.summariesByProject(
          variables.connectionId,
          variables.projectKey,
        ),
      });
    },
  });
};

export const useRerunAnalysisMutation = () => {
  // If rerun returns updated summary/details, we should update cache ideally
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (analysisId: string) =>
      analysisService.rerunAnalysis(analysisId),
    onSuccess: (data, analysisId) => {
      // We might need to invalidate summaries to show new status
      queryClient.invalidateQueries({ queryKey: ANALYSIS_KEYS.all });
    },
  });
};

export const useMarkDefectSolvedMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ defectId, solved }: { defectId: string; solved: boolean }) =>
      analysisService.markDefectAsSolved(defectId, solved ? 1 : 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANALYSIS_KEYS.all });
    },
  });
};

export const useGenerateProposalsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (analysisId: string) =>
      analysisService.generateProposalsFromAnalysis(analysisId),
    onSuccess: (_, analysisId) => {
      // Invalidate proposals for this session
      // We need PROPOSAL_KEYS here? Or just let the component handle it?
      // Component will likely use `useSessionProposalsQuery` which uses PROPOSAL_KEYS.
      // We can't easily import PROPOSAL_KEYS here without circular dependency if not careful or just duplicate key logic.
      // But actually `useSessionProposalsQuery` key is simply ["proposals", "session", sessionId].
      queryClient.invalidateQueries({
        queryKey: ["proposals", "session", analysisId],
      });
    },
  });
};
