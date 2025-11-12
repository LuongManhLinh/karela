import { invoke, view } from "@forge/bridge";
import { ApiResponse } from "../common/apiResponse";
import { ChatMessageDto, ChatSessionDto } from "./types";

const loadContextKeys = async () => {
  const context = await view.getContext();

  const projectKey = context.extension?.project?.key || "DEMO";
  // |__unknow__| Replace fallback with project key from the Forge context
  const storyKey =
    context.extension?.issue?.key || context.extension?.issue?.id || undefined;
  // |__unknow__| Replace fallback with the issue/story key from context when available
  return { projectKey, storyKey };
};

export const ChatService = {
  createChatSession: async (
    userMessage: string
  ): Promise<ApiResponse<string>> => {
    const { projectKey, storyKey } = await loadContextKeys();
    return (await invoke("createChatSession", {
      projectKey,
      storyKey: storyKey || null,
      userMessage,
    })) as ApiResponse<string>;
  },
  getChatSessionByProjectAndStory: async (): Promise<
    ApiResponse<ChatSessionDto>
  > => {
    const { projectKey, storyKey } = await loadContextKeys();
    return (await invoke("getChatSessionByProjectAndStory", {
      projectKey,
      storyKey: storyKey || null,
    })) as ApiResponse<ChatSessionDto>;
  },

  getChatSession: async (
    sessionId: string
  ): Promise<ApiResponse<ChatSessionDto>> => {
    return (await invoke("getChatSession", {
      sessionId,
    })) as ApiResponse<ChatSessionDto>;
  },

  getLatestAfter: async (
    sessionId: string,
    messageId: number
  ): Promise<ApiResponse<ChatMessageDto[]>> => {
    return (await invoke("getChatMessagesAfter", {
      sessionId,
      messageId,
    })) as ApiResponse<ChatMessageDto[]>;
  },

  postMessage: async (
    sessionId: string,
    message: string
  ): Promise<ApiResponse<string>> => {
    const { projectKey, storyKey } = await loadContextKeys();
    return (await invoke("postChatMessage", {
      sessionId,
      message,
      projectKey,
      storyKey: storyKey || null,
    })) as ApiResponse<string>;
  },
};
