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
  storyDetails: (
    connectionName: string,
    projectKey: string,
    storyKey: string,
  ) =>
    [
      ...CONNECTION_KEYS.all,
      "storyDetails",
      connectionName,
      projectKey,
      storyKey,
    ] as const,
};

export const useConnectionSyncStatusQuery = (connectionId: string) => {
  return useQuery({
    queryKey: CONNECTION_KEYS.syncStatus(connectionId),
    queryFn: () => connectionService.getConnectionSyncStatus(connectionId),
  });
};

export const useUserConnectionsQuery = () => {
  return useQuery({
    queryKey: CONNECTION_KEYS.connections(),
    queryFn: () => connectionService.getUserConnections(),
  });
};

export const useProjectDtosQuery = (connectionName: string | undefined) => {
  return useQuery({
    queryKey: CONNECTION_KEYS.projects(connectionName || ""),
    queryFn: () => connectionService.getProjects(connectionName!),
    enabled: !!connectionName,
  });
};

export const useStorySummariesQuery = (
  connectionName: string | undefined,
  projectKey: string | undefined,
) => {
  return useQuery({
    queryKey: CONNECTION_KEYS.storySummaries(
      connectionName || "",
      projectKey || "",
    ),
    queryFn: () =>
      connectionService.getStorySummaries(connectionName!, projectKey!),
    enabled: !!connectionName && !!projectKey,
  });
};

export const useStoryDetailsQuery = (
  connectionName: string | undefined,
  projectKey: string | undefined,
  storyKey: string | undefined,
) => {
  return useQuery({
    queryKey: CONNECTION_KEYS.storyDetails(
      connectionName || "",
      projectKey || "",
      storyKey || "",
    ),
    queryFn: () =>
      connectionService.getStory(connectionName!, projectKey!, storyKey!),
    enabled: !!connectionName && !!projectKey && !!storyKey,
  });
};
