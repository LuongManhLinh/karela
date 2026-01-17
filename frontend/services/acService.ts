import api from "./api";
import { AIResponse } from "../types/ac";

export const acService = {
  getSuggestions: async (
    storyKey: string,
    content: string,
    cursorLine: number,
    cursorColumn: number,
    context?: string
  ): Promise<AIResponse> => {
    const response = await api.post("/ac/suggest", {
      story_key: storyKey,
      content,
      cursor_line: cursorLine,
      cursor_column: cursorColumn,
      context,
    });
    return response.data;
  },
};
