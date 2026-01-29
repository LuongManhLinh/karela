import { ConnectionDto, ProjectDto, StorySummary } from "@/types/connection";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkspaceState {
  selectedConnection: ConnectionDto | null;
  selectedProject: ProjectDto | null;
  selectedStory: StorySummary | null;
  headerProjectKey: string;
  headerStoryKey: string;

  connections: ConnectionDto[];
  projects: ProjectDto[];
  stories: StorySummary[];

  setSelectedConnection: (connection: ConnectionDto | null) => void;
  setSelectedProject: (project: ProjectDto | null) => void;
  setSelectedStory: (story: StorySummary | null) => void;
  setHeaderProjectKey: (key: string) => void;
  setHeaderStoryKey: (key: string) => void;
  setConnections: (connections: ConnectionDto[]) => void;
  setProjects: (projects: ProjectDto[]) => void;
  setStories: (stories: StorySummary[]) => void;

  // Actions to reset dependent states
  resetSelection: () => void;
  resetHeaderKeys: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      selectedConnection: null,
      selectedProject: null,
      selectedStory: null,
      headerProjectKey: "",
      headerStoryKey: "",
      connections: [],
      projects: [],
      stories: [],

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
      setHeaderProjectKey: (key) => set({ headerProjectKey: key }),
      setHeaderStoryKey: (key) => set({ headerStoryKey: key }),

      setConnections: (connections) => set({ connections }),
      setProjects: (projects) => set({ projects }),
      setStories: (stories) => set({ stories }),

      resetSelection: () =>
        set({
          selectedConnection: null,
          selectedProject: null,
          selectedStory: null,
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
