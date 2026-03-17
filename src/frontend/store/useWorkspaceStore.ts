import { ConnectionDto, ProjectDto, StorySummary } from "@/types/connection";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkspaceState {
  connection: ConnectionDto | null;
  selectedProject: ProjectDto | null;
  selectedStory: StorySummary | null;
  projects: ProjectDto[];
  stories: StorySummary[];

  runSelectedProject: ProjectDto | null;
  runSelectedStory: StorySummary | null;
  runProjects: ProjectDto[];
  runStories: StorySummary[];

  headerProjectKey: string;
  headerStoryKey: string;

  setConnection: (connection: ConnectionDto) => void;

  setSelectedProject: (project: ProjectDto | null) => void;
  setSelectedStory: (story: StorySummary | null) => void;
  setProjects: (projects: ProjectDto[]) => void;
  setStories: (stories: StorySummary[]) => void;

  setRunSelectedProject: (project: ProjectDto | null) => void;
  setRunSelectedStory: (story: StorySummary | null) => void;
  setRunProjects: (projects: ProjectDto[]) => void;
  setRunStories: (stories: StorySummary[]) => void;

  setHeaderProjectKey: (key: string) => void;
  setHeaderStoryKey: (key: string) => void;

  // Actions to reset dependent states
  resetSelection: () => void;
  resetHeaderKeys: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      connection: null,

      selectedProject: null,
      selectedStory: null,
      runSelectedProject: null,
      runSelectedStory: null,
      headerProjectKey: "",
      headerStoryKey: "",
      projects: [],
      stories: [],
      runProjects: [],
      runStories: [],

      setConnection: (connection) => set({ connection: connection }),

      setSelectedProject: (proj) =>
        set((state) => ({
          selectedProject: proj,
          selectedStory: null, // Reset story when project changes
        })),

      setSelectedStory: (story) => set({ selectedStory: story }),

      setRunSelectedProject: (proj) =>
        set((state) => ({
          runSelectedProject: proj,
          runSelectedStory: null,
        })),

      setRunSelectedStory: (story) => set({ runSelectedStory: story }),

      setHeaderProjectKey: (key) => set({ headerProjectKey: key }),
      setHeaderStoryKey: (key) => set({ headerStoryKey: key }),

      setProjects: (projects) => set({ projects: projects }),
      setStories: (stories) => set({ stories: stories }),

      setRunProjects: (projects) => set({ runProjects: projects }),
      setRunStories: (stories) => set({ runStories: stories }),

      resetSelection: () =>
        set({
          selectedProject: null,
          selectedStory: null,
          runSelectedProject: null,
          runSelectedStory: null,
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
