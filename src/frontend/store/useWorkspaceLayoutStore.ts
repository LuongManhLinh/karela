import { create } from "zustand";
import { persist } from "zustand/middleware";

/** The four panel position slots (1-based for user clarity). */
export type PanelPosition = 0 | 1 | 2 | 3;

/** Supported arrangement types. */
export type LayoutType = "tabs" | "stacked" | "grid";

/** Default panel IDs in order. */
export const DEFAULT_PANEL_ORDER: string[] = [
  "information",
  "defects",
  "proposals",
  "acceptance-criteria",
];

export interface WorkspaceLayoutState {
  layoutType: LayoutType;
  /** Maps position index (0-3) → panel id */
  panelOrder: string[];
  /** Row heights for each row in px (index 0 = row 0, etc.) */
  rowHeights: number[];
  /** For grid layout: the fraction (0-1) of the left column width per row */
  columnRatios: number[];
}

interface WorkspaceLayoutStore extends WorkspaceLayoutState {
  setLayoutType: (type: LayoutType) => void;
  setPanelOrder: (order: string[]) => void;
  swapPanels: (posA: number, posB: number) => void;
  setRowHeight: (rowIndex: number, height: number) => void;
  setColumnRatio: (rowIndex: number, ratio: number) => void;
  reset: () => void;
}

const DEFAULT_STATE: WorkspaceLayoutState = {
  layoutType: "tabs",
  panelOrder: [...DEFAULT_PANEL_ORDER],
  rowHeights: [300, 300], // two rows for grid; stacked uses individual heights
  columnRatios: [0.5, 0.5],
};

export const useWorkspaceLayoutStore = create<WorkspaceLayoutStore>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setLayoutType: (layoutType) => set({ layoutType }),

      setPanelOrder: (panelOrder) => set({ panelOrder }),

      swapPanels: (posA, posB) =>
        set((state) => {
          const order = [...state.panelOrder];
          [order[posA], order[posB]] = [order[posB], order[posA]];
          return { panelOrder: order };
        }),

      setRowHeight: (rowIndex, height) =>
        set((state) => {
          const rowHeights = [...state.rowHeights];
          rowHeights[rowIndex] = height;
          return { rowHeights };
        }),

      setColumnRatio: (rowIndex, ratio) =>
        set((state) => {
          const columnRatios = [...state.columnRatios];
          columnRatios[rowIndex] = Math.max(0.2, Math.min(0.8, ratio));
          return { columnRatios };
        }),

      reset: () => set({ ...DEFAULT_STATE }),
    }),
    {
      name: "workspace-layout-preferences",
    },
  ),
);
