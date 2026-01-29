import { useQuery } from "@tanstack/react-query";
import { acService } from "@/services/acService";

export const AC_KEYS = {
  all: ["ac"] as const,

  ac: (connectionId: string, acId: string) =>
    [...AC_KEYS.all, "ac", connectionId, acId] as const,
  connectionACs: (connectionId: string) =>
    [...AC_KEYS.all, "connectionACs", connectionId] as const,
  projectACs: (connectionId: string, projectKey: string) =>
    [...AC_KEYS.all, "projectACs", connectionId, projectKey] as const,
  storyAcs: (connectionId: string, projectKey: string, storyKey: string) =>
    [...AC_KEYS.all, "acs", connectionId, projectKey, storyKey] as const,
  story: (acId: string) => [...AC_KEYS.all, "story", acId] as const,
};

export const useACQuery = (
  connectionName: string | undefined,
  acIdOrKey: string | undefined,
) => {
  return useQuery({
    queryKey: AC_KEYS.ac(
      connectionName || "",
      acIdOrKey || "",
    ),
    queryFn: () => acService.getAC(connectionName!, acIdOrKey!),
    enabled: !!connectionName && !!acIdOrKey,
  });
};

export const useACsByConnectionQuery = (connectionName: string | undefined) => {
  return useQuery({
    queryKey: AC_KEYS.connectionACs(connectionName || ""),
    queryFn: () => acService.listACsByConnection(connectionName!),
    enabled: !!connectionName,
  });
};

export const useACsByProjectQuery = (
  connectionName: string | undefined,
  projectKey: string | undefined,
) => {
  return useQuery({
    queryKey: AC_KEYS.projectACs(connectionName || "", projectKey || ""),
    queryFn: () => acService.listACsByProject(connectionName!, projectKey!),
    enabled: !!connectionName && !!projectKey,
  });
};

export const useACsByStoryQuery = (
  connectionName: string | undefined,
  projectKey: string | undefined,
  storyKey: string | undefined,
) => {
  return useQuery({
    queryKey: AC_KEYS.storyAcs(
      connectionName || "",
      projectKey || "",
      storyKey || "",
    ),
    queryFn: () =>
      acService.listACsByStory(connectionName!, projectKey!, storyKey!),
    enabled: !!connectionName && !!projectKey && !!storyKey,
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
