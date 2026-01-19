import { useQuery } from "@tanstack/react-query";
import { connectionService } from "@/services/connectionService";

export const CONNECTION_KEYS = {
  all: ["connection"] as const,
  connections: () => [...CONNECTION_KEYS.all, "connections"] as const,
  projects: (connectionId: string) =>
    [...CONNECTION_KEYS.all, "projects", connectionId] as const,
  storySummaries: (connectionId: string, projectKey: string) =>
    [...CONNECTION_KEYS.all, "stories", connectionId, projectKey] as const,
  syncStatus: (connectionId: string) =>
    [...CONNECTION_KEYS.all, "syncStatus", connectionId] as const,
  storyDetails: (connectionId: string, projectKey: string, storyKey: string) =>
    [
      ...CONNECTION_KEYS.all,
      "storyDetails",
      connectionId,
      projectKey,
      storyKey,
    ] as const,
};

export const useConnectionSyncStatusQuery = (connectionId: string) => {
  return useQuery({
    queryKey: CONNECTION_KEYS.syncStatus(connectionId),
    queryFn: () => connectionService.getConnectionSyncStatus(connectionId),
    refetchInterval: (query) => {
      const status = query.state.data?.data?.sync_status;
      const error = query.state.data?.data?.sync_error;
      // Poll if not SYNCED and no error
      if (status && status !== "SYNCED" && !error) {
        return 1000;
      }
      return false;
    },
  });
};

export const useUserConnectionsQuery = () => {
  return useQuery({
    queryKey: CONNECTION_KEYS.connections(),
    queryFn: () => connectionService.getUserConnections(),
  });
};

export const useProjectDtosQuery = (connectionId: string | undefined) => {
  return useQuery({
    queryKey: CONNECTION_KEYS.projects(connectionId || ""),
    queryFn: () => connectionService.getProjects(connectionId!),
    enabled: !!connectionId,
  });
};

export const useStorySummariesQuery = (
  connectionId: string | undefined,
  projectKey: string | undefined,
) => {
  return useQuery({
    queryKey: CONNECTION_KEYS.storySummaries(
      connectionId || "",
      projectKey || "",
    ),
    queryFn: () =>
      connectionService.getStorySummaries(connectionId!, projectKey!),
    enabled: !!connectionId && !!projectKey,
  });
};

export const useStoryDetailsQuery = (
  connectionId: string | undefined,
  projectKey: string | undefined,
  storyKey: string | undefined,
) => {
  return useQuery({
    queryKey: CONNECTION_KEYS.storyDetails(
      connectionId || "",
      projectKey || "",
      storyKey || "",
    ),
    queryFn: () =>
      connectionService.getStory(connectionId!, projectKey!, storyKey!),
    enabled: !!connectionId && !!projectKey && !!storyKey,
  });
};
