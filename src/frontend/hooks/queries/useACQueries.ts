import { useQuery } from "@tanstack/react-query";
import { acService } from "@/services/acService";

export const AC_KEYS = {
  all: ["ac"] as const,

  ac: (acId: string) => [...AC_KEYS.all, "ac", acId] as const,
  connectionACs: () => [...AC_KEYS.all, "connectionACs"] as const,
  projectACs: (projectKey: string) =>
    [...AC_KEYS.all, "projectACs", projectKey] as const,
  storyAcs: (projectKey: string, storyKey: string) =>
    [...AC_KEYS.all, "acs", projectKey, storyKey] as const,
  story: (acId: string) => [...AC_KEYS.all, "story", acId] as const,
};

export const useACQuery = (acIdOrKey: string | undefined) => {
  return useQuery({
    queryKey: AC_KEYS.ac(acIdOrKey || ""),
    queryFn: () => acService.getAC(acIdOrKey!),
    enabled: !!acIdOrKey,
  });
};

export const useACsByConnectionQuery = () => {
  return useQuery({
    queryKey: AC_KEYS.connectionACs(),
    queryFn: () => acService.listACsByConnection(),
  });
};

export const useACsByProjectQuery = (projectKey: string | undefined) => {
  return useQuery({
    queryKey: AC_KEYS.projectACs(projectKey || ""),
    queryFn: () => acService.listACsByProject(projectKey!),
    enabled: !!projectKey,
  });
};

export const useACsByStoryQuery = (
  projectKey: string | undefined,
  storyKey: string | undefined,
) => {
  return useQuery({
    queryKey: AC_KEYS.storyAcs(projectKey || "", storyKey || ""),
    queryFn: () => acService.listACsByStory(projectKey!, storyKey!),
    enabled: !!projectKey && !!storyKey,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useStoryByACQuery = (acId: string | undefined) => {
  return useQuery({
    queryKey: AC_KEYS.story(acId || ""),
    queryFn: () => acService.getStoryByAC(acId!),
    enabled: !!acId,
  });
};
