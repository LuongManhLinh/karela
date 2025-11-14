import { invoke, view } from "@forge/bridge";
import { ApiResponse } from "../../common/apiResponse";
import {
  ChatMessageDto,
  ChatSessionDto,
  CreateSessionResponse,
  MessagePostResponse as PostMessageResponse,
} from "../types/chats";

const loadContextKeys = async () => {
  const context = await view.getContext();

  const projectKey = context.extension?.project?.key || "DEMO";
  // |__unknow__| Replace fallback with project key from the Forge context
  const storyKey = context.extension?.issue?.key || undefined;
  // |__unknow__| Replace fallback with the issue/story key from context when available
  return { projectKey, storyKey };
};

export const ChatService = {
  createChatSession: async (
    userMessage: string
  ): Promise<ApiResponse<ChatSessionDto>> => {
    const { projectKey, storyKey } = await loadContextKeys();
    if (!projectKey) {
      return {
        data: null,
        errors: ["Project key is undefined"],
      };
    }
    return (await invoke("createChatSession", {
      projectKey,
      storyKey: storyKey || null,
      userMessage,
    })) as ApiResponse<ChatSessionDto>;
  },
  getChatSessionByProjectAndStory: async (): Promise<
    ApiResponse<ChatSessionDto>
  > => {
    const { projectKey, storyKey } = await loadContextKeys();
    if (!projectKey) {
      return {
        data: null,
        errors: ["Project key is undefined"],
      };
    }
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
  ): Promise<ApiResponse<PostMessageResponse>> => {
    const { projectKey, storyKey } = await loadContextKeys();
    if (!projectKey) {
      return {
        data: null,
        errors: ["Project key is undefined"],
      };
    }
    return (await invoke("postChatMessage", {
      sessionId,
      message,
      projectKey,
      storyKey: storyKey || null,
    })) as ApiResponse<PostMessageResponse>;
  },
};

export const MockChatService = {
  createChatSession: async (
    userMessage: string
  ): Promise<ApiResponse<ChatSessionDto>> => {
    return {
      data: {
        id: "mock-session-123",
        project_key: "DEMO",
        story_key: "DEMO-123",
        created_at: new Date().toISOString(),
        messages: [
          {
            id: 1,
            role: "user",
            content: userMessage,
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            role: "ai",
            content: "This is a mock AI response to your message.",
            created_at: new Date().toISOString(),
          },
        ],
        change_proposals: [],
      },
      errors: null,
    };
  },

  getChatSessionByProjectAndStory: async (): Promise<
    ApiResponse<ChatSessionDto>
  > => {
    return {
      data: {
        id: "mock-session-123",
        project_key: "DEMO",
        story_key: "DEMO-123",
        created_at: "2025-11-13T10:00:00Z",
        messages: [
          {
            id: 1,
            role: "user",
            content: "Hello, I need help analyzing defects in this project.",
            created_at: "2025-11-13T10:00:00Z",
          },
          {
            id: 2,
            role: "ai",
            content:
              "I'll help you analyze defects. Let me start by examining your project.",
            created_at: "2025-11-13T10:01:00Z",
          },
          {
            id: 3,
            role: "analysis_progress",
            content: "Analysis in progress...",
            created_at: "2025-11-13T10:02:00Z",
            analysis_id: "analysis-456",
            status: "IN_PROGRESS",
          },
          {
            id: 4,
            role: "user",
            content: "Any updates on the analysis?",
            created_at: "2025-11-13T10:03:00Z",
          },
          {
            id: 5,
            role: "analysis_progress",
            content: "Analysis completed.",
            created_at: "2025-11-13T10:04:00Z",
            analysis_id: "analysis-456",
            status: "DONE",
          },
          {
            id: 6,
            role: "ai",
            content:
              "The analysis is complete. I've identified several areas for improvement.",
            created_at: "2025-11-13T10:05:00Z",
          },
          {
            id: 7,
            role: "ai",
            content:
              "Based on the analysis, I propose creating new stories to address the defects found.",
            created_at: "2025-11-13T10:06:00Z",
          },
          {
            id: 8,
            role: "user",
            content: "Please share the proposed stories.",
            created_at: "2025-11-13T10:07:00Z",
          },
          {
            id: 9,
            role: "ai",
            content:
              "Here are the proposed stories based on the analysis of defects.",
            created_at: "2025-11-13T10:08:00Z",
          },
          {
            id: 10,
            role: "ai",
            content:
              "1. Story to fix null pointer exceptions in user service.\n2. Story to improve performance of data retrieval.\n3. Story to enhance security protocols.",
            created_at: "2025-11-13T10:09:00Z",
          },
        ],
        change_proposals: [
          {
            id: "proposal-789",
            session_id: "mock-session-123",
            project_key: "DEMO",
            type: "CREATE",
            accepted: null,
            created_at: "2025-11-13T10:05:00Z",
            contents: [
              {
                story_key: "DEMO-124",
                summary: "Fix null pointer exception in user service",
                description:
                  "Add null checks to prevent crashes when user data is missing",
              },
              {
                story_key: "DEMO-125",
                summary: undefined,
                description:
                  "Refactor queries to use indexing and reduce load times",
              },
            ],
          },
          {
            id: "proposal-790",
            session_id: "mock-session-123",
            project_key: "DEMO",
            type: "UPDATE",
            accepted: true,
            created_at: "2025-11-13T10:10:00Z",
            contents: [
              {
                story_key: "DEMO-123",
                summary: "Improve performance of data retrieval",
                description:
                  "Optimize database queries to reduce latency in data fetching",
              },
            ],
          },
        ],
      },
      errors: null,
    };
  },

  getChatSession: async (
    sessionId: string
  ): Promise<ApiResponse<ChatSessionDto>> => {
    return {
      data: {
        id: sessionId,
        project_key: "DEMO",
        story_key: "DEMO-123",
        created_at: "2025-11-13T10:00:00Z",
        messages: [
          {
            id: 1,
            role: "user",
            content: "Can you analyze this specific session?",
            created_at: "2025-11-13T10:00:00Z",
          },
          {
            id: 2,
            role: "ai",
            content: "Sure! I'm analyzing the session data now.",
            created_at: "2025-11-13T10:01:00Z",
          },
        ],
        change_proposals: [],
      },
      errors: null,
    };
  },

  getLatestAfter: async (
    sessionId: string,
    messageId: number
  ): Promise<ApiResponse<ChatMessageDto[]>> => {
    return {
      data: [
        {
          id: messageId + 1,
          role: "ai",
          content: `New message after ID ${messageId} in session ${sessionId}`,
          created_at: new Date().toISOString(),
        },
        {
          id: messageId + 2,
          role: "user",
          content: "Thanks for the update!",
          created_at: new Date().toISOString(),
        },
      ],
      errors: null,
    };
  },

  postMessage: async (
    sessionId: string,
    message: string
  ): Promise<ApiResponse<PostMessageResponse>> => {
    return {
      data: {
        message_id: Math.floor(Math.random() * 1000) + 100,
        message_created_at: new Date().toISOString(),
      },
      errors: null,
    };
  },
};
