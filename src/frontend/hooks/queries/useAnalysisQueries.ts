import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analysisService } from "@/services/analysisService";
import type { RunAnalysisRequest } from "@/types/analysis";

export const ANALYSIS_KEYS = {
  all: ["analysis"] as const,
  summariesByConnection: () => [...ANALYSIS_KEYS.all, "summaries"] as const,
  summariesByProject: (projectKey: string) =>
    [...ANALYSIS_KEYS.all, "summaries", projectKey] as const,
  summariesByStory: (projectKey: string, storyKey: string) =>
    [...ANALYSIS_KEYS.all, "summaries", projectKey, storyKey] as const,
  details: (analysisIdOrKey: string) =>
    [...ANALYSIS_KEYS.all, "details", analysisIdOrKey] as const,
  statuses: (ids: string[]) =>
    [...ANALYSIS_KEYS.all, "statuses", ...ids.sort()] as const,
  defectsByStory: (projectKey: string, storyKey: string) =>
    [...ANALYSIS_KEYS.all, "defects", projectKey, storyKey] as const,
};

export const useAnalysisSummariesByConnectionQuery = () => {
  return useQuery({
    queryKey: ANALYSIS_KEYS.summariesByConnection(),
    queryFn: () => analysisService.getAnalysisSummariesByConnection(),
  });
};

export const useAnalysisSummariesByProjectQuery = (
  projectKey: string | undefined,
) => {
  return useQuery({
    queryKey: ANALYSIS_KEYS.summariesByProject(projectKey || ""),
    queryFn: () => analysisService.getAnalysisSummariesByProject(projectKey!),
    enabled: !!projectKey,
  });
};

export const useAnalysisSummariesByStoryQuery = (
  projectKey: string | undefined,
  storyKey: string | undefined,
) => {
  return useQuery({
    queryKey: ANALYSIS_KEYS.summariesByStory(projectKey || "", storyKey || ""),
    queryFn: () =>
      analysisService.getAnalysisSummariesByStory(projectKey!, storyKey!),
    enabled: !!projectKey && !!storyKey,
  });
};

export const useDefectsByStoryQuery = (
  projectKey: string | undefined,
  storyKey: string | undefined,
) => {
  return useQuery({
    queryKey: ANALYSIS_KEYS.defectsByStory(projectKey || "", storyKey || ""),
    queryFn: () => analysisService.listDefectsByStory(projectKey!, storyKey!),
    enabled: !!projectKey && !!storyKey,
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
      projectKey,
      data,
    }: {
      projectKey: string;
      data: RunAnalysisRequest;
    }) => analysisService.runAnalysis(projectKey, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ANALYSIS_KEYS.summariesByProject(variables.projectKey),
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
