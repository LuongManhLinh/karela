import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkspaceState {
  selectedConnectionId: string | null;
  selectedProjectKey: string | null;
  selectedStoryKey: string | null;

  setSelectedConnectionId: (id: string | null) => void;
  setSelectedProjectKey: (key: string | null) => void;
  setSelectedStoryKey: (key: string | null) => void;
  
  // Actions to reset dependent states
  resetSelection: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      selectedConnectionId: null,
      selectedProjectKey: null,
      selectedStoryKey: null,

      setSelectedConnectionId: (id) =>
        set((state) => ({
          selectedConnectionId: id,
          selectedProjectKey: null, // Reset project when connection changes
          selectedStoryKey: null,   // Reset story when connection changes
        })),

      setSelectedProjectKey: (key) =>
        set((state) => ({
          selectedProjectKey: key,
          selectedStoryKey: null, // Reset story when project changes
        })),

      setSelectedStoryKey: (key) => set({ selectedStoryKey: key }),

      resetSelection: () =>
        set({
          selectedConnectionId: null,
          selectedProjectKey: null,
          selectedStoryKey: null,
        }),
    }),
    {
      name: "workspace-storage", // name of the item in the storage (must be unique)
      // default is localStorage
    }
  )
);
