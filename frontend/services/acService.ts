import api from "./api";
import { ACDto, ACSummary, AIResponse } from "../types/ac";
import { BasicResponse } from "@/types";

export const acService = {
  getSuggestions: async (
    storyKey: string,
    content: string,
    cursorLine: number,
    cursorColumn: number,
    context?: string,
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
  listACsByStory: async (
    connectionName: string,
    projectKey: string,
    storyKey: string,
  ): Promise<BasicResponse<ACSummary[]>> => {
    const response = await api.get<BasicResponse<ACSummary[]>>(
      `/acs/connections/${connectionName}/projects/${projectKey}/stories/${storyKey}`,
    );
    return response.data;
  },

  listACsByProject: async (
    connectionName: string,
    projectKey: string,
  ): Promise<BasicResponse<ACSummary[]>> => {
    const response = await api.get<BasicResponse<ACSummary[]>>(
      `/acs/connections/${connectionName}/projects/${projectKey}`,
    );
    return response.data;
  },

  createAC: async (
    connectionName: string,
    projectKey: string,
    storyKey: string,
    genWithAI: boolean,
  ): Promise<BasicResponse<string>> => {
    const response = await api.post<BasicResponse<string>>(
      `/acs/connections/${connectionName}/projects/${projectKey}/stories/${storyKey}`,
      { gen_with_ai: genWithAI },
    );
    return response.data;
  },
  getAC: async (
    connectionName: string,
    projectKey: string,
    storyKey: string,
    acIdOrKey: string,
  ): Promise<BasicResponse<ACDto>> => {
    const response = await api.get<BasicResponse<ACDto>>(
      `/acs/connections/${connectionName}/projects/${projectKey}/stories/${storyKey}/acs/${acIdOrKey}`,
    );
    return response.data;
  },
  regenerateAC: async (
    acId: string,
    gherkin: string,
    feedback: string,
  ): Promise<void> => {
    await api.post(`/acs/${acId}/regenerate`, { content: gherkin, feedback });
  },
  updateAC: async (acId: string, newContent: string): Promise<void> => {
    await api.put(`/acs/${acId}`, { content: newContent });
  },
  deleteAC: async (acId: string): Promise<void> => {
    await api.delete(`/acs/${acId}`);
  },
};
