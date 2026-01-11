import { create } from "zustand";
import { GherkinAC, AISuggestion } from "../types/ac";
import { acService } from "../services/acService";

interface ACState {
  acs: GherkinAC[];
  selectedACId: string | null;
  loading: boolean;
  suggestions: AISuggestion[];
  annotations: any[]; // Ace annotations

  fetchACs: (storyId: string) => Promise<void>;
  createAC: (storyId: string, content: string) => Promise<string | undefined>;
  updateAC: (id: string, content: string) => Promise<void>;
  deleteAC: (id: string) => Promise<void>;
  selectAC: (id: string | null) => void;

  fetchSuggestions: (
    content: string,
    line: number,
    col: number
  ) => Promise<void>;
  clearSuggestions: () => void;
  lintContent: (content: string) => void;
}

export const useACStore = create<ACState>((set, get) => ({
  acs: [],
  selectedACId: null,
  loading: false,
  suggestions: [],
  annotations: [],

  fetchACs: async (storyId) => {
    set({ loading: true });
    try {
      const acs = await acService.getACs(storyId);
      set({ acs, loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  createAC: async (storyId, content) => {
    try {
      const newAC = await acService.createAC({
        jira_story_id: storyId,
        content,
      });
      set((state) => ({ acs: [...state.acs, newAC], selectedACId: newAC.id }));
      return newAC.id;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  },

  updateAC: async (id, content) => {
    try {
      const updated = await acService.updateAC(id, { content });
      set((state) => ({
        acs: state.acs.map((ac) => (ac.id === id ? updated : ac)),
      }));
    } catch (error) {
      console.error(error);
    }
  },

  deleteAC: async (id) => {
    try {
      await acService.deleteAC(id);
      set((state) => ({
        acs: state.acs.filter((ac) => ac.id !== id),
        selectedACId: state.selectedACId === id ? null : state.selectedACId,
      }));
    } catch (error) {
      console.error(error);
    }
  },

  selectAC: (id) => set({ selectedACId: id }),

  fetchSuggestions: async (content, line, col) => {
    try {
      const res = await acService.getSuggestions(content, line, col);
      set({ suggestions: res.suggestions });
    } catch (error) {
      console.error(error);
    }
  },

  clearSuggestions: () => set({ suggestions: [] }),

  lintContent: (content) => {
      // Implement basic linting for now as gherkin-lint is Node-only.
      // We mimic gherkin-lint rules.
      const { lintGherkin } = require('../utils/gherkin-linter');
      const errors = lintGherkin(content);
      
      const annotations = errors.map((err: any) => ({
          row: err.line - 1,
          column: err.column || 0,
          text: err.message,
          type: 'error'
      }));
      set({ annotations });
  }
}));
