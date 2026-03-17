import { useQuery } from "@tanstack/react-query";
import { connectionService } from "@/services/connectionService";

export const CONNECTION_KEYS = {
  all: ["connection"] as const,
  connections: () => [...CONNECTION_KEYS.all, "connections"] as const,
  projects: () => [...CONNECTION_KEYS.all, "projects"] as const,
  storySummaries: (projectKey: string) =>
    [...CONNECTION_KEYS.all, "stories", projectKey] as const,
  syncStatus: () => [...CONNECTION_KEYS.all, "syncStatus"] as const,
  storyDetails: (storyKey: string) =>
    [...CONNECTION_KEYS.all, "storyDetails", storyKey] as const,
  projectDashboard: (projectKey: string) =>
    [...CONNECTION_KEYS.all, "projectDashboard", projectKey] as const,
  storyDashboard: (projectKey: string, storyKey: string) =>
    [...CONNECTION_KEYS.all, "storyDashboard", projectKey, storyKey] as const,
  connectionDashboard: () =>
    [...CONNECTION_KEYS.all, "connectionDashboard"] as const,
  projectsSync: () => [...CONNECTION_KEYS.all, "syncProjects"] as const,
};

export const useConnectionSyncStatusQuery = () => {
  return useQuery({
    queryKey: CONNECTION_KEYS.syncStatus(),
    queryFn: () => connectionService.getConnectionSyncStatus(),
  });
};

export const useConnectionQuery = () => {
  return useQuery({
    queryKey: CONNECTION_KEYS.connections(),
    queryFn: () => connectionService.getConnectionDto(),
  });
};

export const useProjectDtosQuery = () => {
  return useQuery({
    queryKey: CONNECTION_KEYS.projects(),
    queryFn: () => connectionService.getProjects(),
  });
};

export const useStorySummariesQuery = (projectKey: string | undefined) => {
  return useQuery({
    queryKey: CONNECTION_KEYS.storySummaries(projectKey || ""),
    queryFn: () => connectionService.getStorySummaries(projectKey!),
    enabled: !!projectKey,
  });
};

export const useStoryDetailsQuery = (storyKey: string | undefined) => {
  return useQuery({
    queryKey: CONNECTION_KEYS.storyDetails(storyKey || ""),
    queryFn: () => connectionService.getStory(storyKey!),
    enabled: !!storyKey,
  });
};

export const useProjectDashboardQuery = (projectKey: string | undefined) => {
  return useQuery({
    queryKey: CONNECTION_KEYS.projectDashboard(projectKey || ""),
    queryFn: () => connectionService.getProjectDashboardInfo(projectKey!),
    enabled: !!projectKey,
  });
};

export const useStoryDashboardQuery = (
  projectKey: string | undefined,
  storyKey: string | undefined,
) => {
  return useQuery({
    queryKey: CONNECTION_KEYS.storyDashboard(projectKey || "", storyKey || ""),
    queryFn: () =>
      connectionService.getStoryDashboardInfo(projectKey!, storyKey!),
    enabled: !!projectKey && !!storyKey,
  });
};

export const useConnectionDashboardQuery = () => {
  return useQuery({
    queryKey: CONNECTION_KEYS.connectionDashboard(),
    queryFn: () => connectionService.getConnectionDashboardInfo(),
  });
};

export const useProjectsSyncQuery = () => {
  return useQuery({
    queryKey: CONNECTION_KEYS.projectsSync(),
    queryFn: () => connectionService.getProjectsSyncStatus(),
  });
};
