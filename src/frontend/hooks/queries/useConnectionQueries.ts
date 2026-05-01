import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
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
  projectDescription: (projectKey: string) =>
    [...CONNECTION_KEYS.all, "projectDescription", projectKey] as const,
  dashboardStories: (projectKey: string) =>
    [...CONNECTION_KEYS.all, "dashboardStories", projectKey] as const,
  dashboardProjects: () =>
    [...CONNECTION_KEYS.all, "dashboardProjects"] as const,
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

export const useDashboardStoriesInfiniteQuery = (projectKey: string | undefined, limit: number = 10, numStories: number = 0) => {
  return useInfiniteQuery({
    queryKey: CONNECTION_KEYS.dashboardStories(projectKey || ""),
    queryFn: ({ pageParam = 0 }) => connectionService.getDashboardStories(projectKey!, pageParam, limit),
    getNextPageParam: (lastPage, allPages) => {
      const loadedStories = allPages.reduce((acc, page) => acc + (page.data?.length || 0), 0);
      if (loadedStories < numStories) {
        return loadedStories;
      }
      return undefined;
    },
    enabled: !!projectKey,
    initialPageParam: 0,
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

export const useDashboardProjectsInfiniteQuery = (limit: number = 5, numProjects: number = 0) => {
  return useInfiniteQuery({
    queryKey: CONNECTION_KEYS.dashboardProjects(),
    queryFn: ({ pageParam = 0 }) => connectionService.getDashboardProjects(pageParam, limit),
    getNextPageParam: (lastPage, allPages) => {
      const loadedProjects = allPages.reduce((acc, page) => acc + (page.data?.length || 0), 0);
      if (loadedProjects < numProjects) {
        return loadedProjects;
      }
      return undefined;
    },
    initialPageParam: 0,
  });
};

export const useProjectsSyncQuery = () => {
  return useQuery({
    queryKey: CONNECTION_KEYS.projectsSync(),
    queryFn: () => connectionService.getProjectsSyncStatus(),
  });
};

export const useProjectDescriptionQuery = (projectKey: string | undefined) => {
  return useQuery({
    queryKey: CONNECTION_KEYS.projectDescription(projectKey || ""),
    queryFn: () => connectionService.getProjectDescription(projectKey!),
    enabled: !!projectKey,
  });
};

export const useUpdateProjectDescriptionMutation = (projectKey: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (description: string) =>
      connectionService.updateProjectDescription(projectKey, description),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CONNECTION_KEYS.projectDescription(projectKey),
      });
    },
  });
};
