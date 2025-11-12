import { BACKEND_URL } from "./backendUrl";
import api from "@forge/api";

const fetchData = async (url, options) => {
  try {
    const response = await api.fetch(url, options);
    if (!response.ok) {
      const detailedError = await response.text();
      return {
        data: null,
        errors: [
          `Backend responded with status ${response.status}, details: ${detailedError}`,
        ],
      };
    }
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      data: null,
      errors: [`Error communicating with backend: ${error.message}`],
    };
  }
};

const DefectService = {
  analyzeWorkItems: async (projectKey) => {
    return await fetchData(`${BACKEND_URL}/defects/analyses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ projectKey: projectKey, analysisType: "ALL" }),
    });
  },

  getAllAnalysisBriefs: async (projectKey) => {
    return await fetchData(`${BACKEND_URL}/defects/analyses/${projectKey}`, {
      method: "GET",
    });
  },

  getAnalysisStatus: async (analysisId) => {
    return await fetchData(
      `${BACKEND_URL}/defects/analyses/${analysisId}/status`,
      {
        method: "GET",
      }
    );
  },

  getAnalysisDetails: async (analysisId) => {
    return await fetchData(
      `${BACKEND_URL}/defects/analyses/${analysisId}/detail`,
      {
        method: "GET",
      }
    );
  },

  changeDefectSolved: async (defectId, solvedBody) => {
    return await fetchData(`${BACKEND_URL}/defects/defects/${defectId}/solve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(solvedBody),
    });
  },

  createChatSession: async ({ projectKey, storyKey, userMessage }) => {
    const body = {
      project_key: projectKey,
      user_message: userMessage,
      story_key: storyKey,
    };
    return await fetchData(`${BACKEND_URL}/defects/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  },

  getChatSessionByProjectAndStory: async ({ projectKey, storyKey }) => {
    return await fetchData(
      `${BACKEND_URL}/defects/chat/session/${projectKey}${
        storyKey ? "/" + storyKey : ""
      }`,
      {
        method: "GET",
      }
    );
  },

  getChatSession: async (sessionId) => {
    return await fetchData(`${BACKEND_URL}/defects/chat/${sessionId}`, {
      method: "GET",
    });
  },

  getChatMessagesAfter: async ({ sessionId, messageId }) => {
    return await fetchData(
      `${BACKEND_URL}/defects/chat/${sessionId}/${messageId}`,
      {
        method: "GET",
      }
    );
  },

  postChatMessage: async ({ sessionId, projectKey, storyKey, message }) => {
    const body = {
      message,
      project_key: projectKey,
      story_key: storyKey,
    };
    return await fetchData(`${BACKEND_URL}/defects/chat/${sessionId}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  },
};

export default DefectService;
