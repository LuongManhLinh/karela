import { ConnectionDto, ProjectDto, StorySummary } from "@/types/connection";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkspaceState {
  connections: ConnectionDto[];

  selectedConnection: ConnectionDto | null;
  selectedProject: ProjectDto | null;
  selectedStory: StorySummary | null;
  projects: ProjectDto[];
  stories: StorySummary[];

  runSelectedConnection: ConnectionDto | null;
  runSelectedProject: ProjectDto | null;
  runSelectedStory: StorySummary | null;
  runProjects: ProjectDto[];
  runStories: StorySummary[];

  urlSelectedConnection: ConnectionDto | null;
  urlSelectedProject: ProjectDto | null;
  urlSelectedStory: StorySummary | null;

  headerProjectKey: string;
  headerStoryKey: string;

  setConnections: (connections: ConnectionDto[]) => void;

  setSelectedConnection: (connection: ConnectionDto | null) => void;
  setSelectedProject: (project: ProjectDto | null) => void;
  setSelectedStory: (story: StorySummary | null) => void;
  setProjects: (projects: ProjectDto[]) => void;
  setStories: (stories: StorySummary[]) => void;

  setRunSelectedConnection: (connection: ConnectionDto | null) => void;
  setRunSelectedProject: (project: ProjectDto | null) => void;
  setRunSelectedStory: (story: StorySummary | null) => void;
  setRunProjects: (projects: ProjectDto[]) => void;
  setRunStories: (stories: StorySummary[]) => void;

  setUrlSelectedConnection: (connection: ConnectionDto | null) => void;
  setUrlSelectedProject: (project: ProjectDto | null) => void;
  setUrlSelectedStory: (story: StorySummary | null) => void;

  setHeaderProjectKey: (key: string) => void;
  setHeaderStoryKey: (key: string) => void;

  // Actions to reset dependent states
  resetSelection: () => void;
  resetHeaderKeys: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      connections: [],

      selectedConnection: null,
      selectedProject: null,
      selectedStory: null,
      runSelectedConnection: null,
      runSelectedProject: null,
      runSelectedStory: null,
      urlSelectedConnection: null,
      urlSelectedProject: null,
      urlSelectedStory: null,
      headerProjectKey: "",
      headerStoryKey: "",
      projects: [],
      stories: [],
      runProjects: [],
      runStories: [],

      setConnections: (connections) => set({ connections: connections }),

      setSelectedConnection: (conn) =>
        set((state) => ({
          selectedConnection: conn,
          selectedProject: null, // Reset project when connection changes
          selectedStory: null, // Reset story when connection changes
        })),

      setSelectedProject: (proj) =>
        set((state) => ({
          selectedProject: proj,
          selectedStory: null, // Reset story when project changes
        })),

      setSelectedStory: (story) => set({ selectedStory: story }),

      setRunSelectedConnection: (conn) =>
        set((state) => ({
          runSelectedConnection: conn,
          runSelectedProject: null,
          runSelectedStory: null,
        })),

      setRunSelectedProject: (proj) =>
        set((state) => ({
          runSelectedProject: proj,
          runSelectedStory: null,
        })),

      setRunSelectedStory: (story) => set({ runSelectedStory: story }),

      setUrlSelectedConnection: (conn) => set({ urlSelectedConnection: conn }),
      setUrlSelectedProject: (proj) => set({ urlSelectedProject: proj }),
      setUrlSelectedStory: (story) => set({ urlSelectedStory: story }),

      setHeaderProjectKey: (key) => set({ headerProjectKey: key }),
      setHeaderStoryKey: (key) => set({ headerStoryKey: key }),

      setProjects: (projects) => set({ projects: projects }),
      setStories: (stories) => set({ stories: stories }),

      setRunProjects: (projects) => set({ runProjects: projects }),
      setRunStories: (stories) => set({ runStories: stories }),

      resetSelection: () =>
        set({
          selectedConnection: null,
          selectedProject: null,
          selectedStory: null,
          runSelectedConnection: null,
          runSelectedProject: null,
          runSelectedStory: null,
          urlSelectedConnection: null,
          urlSelectedProject: null,
          urlSelectedStory: null,
        }),
      resetHeaderKeys: () =>
        set({
          headerProjectKey: "",
          headerStoryKey: "",
        }),
    }),
    {
      name: "workspace-storage", // name of the item in the storage (must be unique)
      // default is localStorage
    },
  ),
);
