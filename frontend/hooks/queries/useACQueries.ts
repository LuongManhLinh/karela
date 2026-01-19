import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chatService";
import type { ChatSessionDto } from "@/types/chat";
import { connectionService } from "@/services/connectionService";

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
  connectionId: string | undefined,
  projectKey: string | undefined,
  storyKey: string | undefined,
) => {
  return useQuery({
    queryKey: AC_KEYS.storyAcs(
      connectionId || "",
      projectKey || "",
      storyKey || "",
    ),
    queryFn: () =>
      connectionService.getACsByStory(connectionId!, projectKey!, storyKey!),
    enabled: !!connectionId && !!projectKey && !!storyKey,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useACQuery = (
  connectionId: string | undefined,
  projectKey: string | undefined,
  storyKey: string | undefined,
  acId: string | undefined,
) => {
  return useQuery({
    queryKey: AC_KEYS.ac(
      connectionId || "",
      projectKey || "",
      storyKey || "",
      acId || "",
    ),
    queryFn: () =>
      connectionService.getAC(connectionId!, projectKey!, storyKey!, acId!),
    enabled: !!connectionId && !!projectKey && !!storyKey && !!acId,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useACsByProjectQuery = (
  connectionId: string | undefined,
  projectKey: string | undefined,
) => {
  return useQuery({
    queryKey: AC_KEYS.projectACs(connectionId || "", projectKey || ""),
    queryFn: () =>
      connectionService.getACsByProject(connectionId!, projectKey!),
    enabled: !!connectionId && !!projectKey,
    staleTime: 60 * 1000, // 1 minute
  });
};
