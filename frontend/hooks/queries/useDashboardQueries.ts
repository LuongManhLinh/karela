import { useQuery } from "@tanstack/react-query";
import { connectionService } from "@/services/connectionService";

export const DASHBOARD_KEYS = {
  all: ["dashboard"] as const,
  project: (connectionId: string, projectKey: string) =>
    [...DASHBOARD_KEYS.all, "project", connectionId, projectKey] as const,
  story: (connectionId: string, projectKey: string, storyKey: string) =>
    [
      ...DASHBOARD_KEYS.all,
      "story",
      connectionId,
      projectKey,
      storyKey,
    ] as const,
};

export const useProjectDashboardQuery = (
  connectionId: string | undefined,
  projectKey: string | undefined,
) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.project(connectionId || "", projectKey || ""),
    queryFn: () =>
      connectionService.getProjectDashboardInfo(connectionId!, projectKey!),
    enabled: !!connectionId && !!projectKey,
  });
};

export const useStoryDashboardQuery = (
  connectionId: string | undefined,
  projectKey: string | undefined,
  storyKey: string | undefined,
) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.story(
      connectionId || "",
      projectKey || "",
      storyKey || "",
    ),
    queryFn: () =>
      connectionService.getStoryDashboardInfo(
        connectionId!,
        projectKey!,
        storyKey!,
      ),
    enabled: !!connectionId && !!projectKey && !!storyKey,
  });
};
