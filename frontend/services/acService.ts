import api from './api';
import { GherkinAC, ACCreate, ACUpdate, AIResponse } from '../types/ac';

export const acService = {
  getACs: async (storyId: string): Promise<GherkinAC[]> => {
    const response = await api.get(`/ac/stories/${storyId}/acs`);
    return response.data;
  },

  createAC: async (data: ACCreate): Promise<GherkinAC> => {
    const response = await api.post('/ac/', data);
    return response.data;
  },

  updateAC: async (id: string, data: ACUpdate): Promise<GherkinAC> => {
    const response = await api.put(`/ac/${id}`, data);
    return response.data;
  },

  deleteAC: async (id: string): Promise<void> => {
    await api.delete(`/ac/${id}`);
  },

  lintAC: async (content: string): Promise<{ output: string }> => {
    const response = await api.post('/ac/lint', { content });
    return response.data;
  },

  getSuggestions: async (content: string, cursorLine: number, cursorColumn: number, context?: string): Promise<AIResponse> => {
    const response = await api.post('/ac/suggest', {
      content,
      cursor_line: cursorLine,
      cursor_column: cursorColumn,
      context
    });
    return response.data;
  }
};
