import { useQuery } from "@tanstack/react-query";
import { acService } from "@/services/acService";

export const AC_KEYS = {
  all: ["ac"] as const,
  storyAcs: (connectionId: string, projectKey: string, storyKey: string) =>
    [...AC_KEYS.all, "acs", connectionId, projectKey, storyKey] as const,
  ac: (
    connectionId: string,
    projectKey: string,
    storyKey: string,
    acId: string,
  ) =>
    [...AC_KEYS.all, "ac", connectionId, projectKey, storyKey, acId] as const,
  projectACs: (connectionId: string, projectKey: string) =>
    [...AC_KEYS.all, "projectACs", connectionId, projectKey] as const,
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

export const useACQuery = (
  connectionName: string | undefined,
  projectKey: string | undefined,
  storyKey: string | undefined,
  acKey: string | undefined,
) => {
  return useQuery({
    queryKey: AC_KEYS.ac(
      connectionName || "",
      projectKey || "",
      storyKey || "",
      acKey || "",
    ),
    queryFn: () =>
      acService.getAC(connectionName!, projectKey!, storyKey!, acKey!),
    enabled: !!connectionName && !!projectKey && !!storyKey && !!acKey,
    staleTime: 60 * 1000, // 1 minute
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
    staleTime: 60 * 1000, // 1 minute
  });
};
