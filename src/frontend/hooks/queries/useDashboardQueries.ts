import { useQuery } from "@tanstack/react-query";
import { connectionService } from "@/services/connectionService";

export const DASHBOARD_KEYS = {
  all: ["dashboard"] as const,
  project: (projectKey: string) =>
    [...DASHBOARD_KEYS.all, "project", projectKey] as const,
  story: (projectKey: string, storyKey: string) =>
    [...DASHBOARD_KEYS.all, "story", projectKey, storyKey] as const,
  connection: () => [...DASHBOARD_KEYS.all, "connection"] as const,
};

export const useProjectDashboardQuery = (projectKey: string | undefined) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.project(projectKey || ""),
    queryFn: () => connectionService.getProjectDashboardInfo(projectKey!),
    enabled: !!projectKey,
  });
};

export const useStoryDashboardQuery = (
  projectKey: string | undefined,
  storyKey: string | undefined,
) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.story(projectKey || "", storyKey || ""),
    queryFn: () =>
      connectionService.getStoryDashboardInfo(projectKey!, storyKey!),
    enabled: !!projectKey && !!storyKey,
  });
};

export const useConnectionDashboardQuery = () => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.connection(),
    queryFn: () => connectionService.getConnectionDashboardInfo(),
  });
};
