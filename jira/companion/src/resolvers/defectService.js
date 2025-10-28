import { BACKEND_URL } from "./backendUrl";
import api from "@forge/api";

const fetchData = async (url, options) => {
  try {
    const response = await api.fetch(url, options);
    if (!response.ok) {
      return {
        data: null,
        error: `Backend responded with status ${response.status}`,
      };
    }
    const data = await response.json();
    return {
      data,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: `Error communicating with backend: ${error.message}`,
    };
  }
};

const DefectService = {
  analyzeWorkItems: async (projectKey) => {
    return await fetchData(`${BACKEND_URL}/defect/analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ projectKey: projectKey }),
    });
  },

  getAllAnalysisBriefs: async () => {
    return await fetchData(`${BACKEND_URL}/defect/analysis`, { method: "GET" });
  },

  getAnalysisStatus: async (analysisId) => {
    return await fetchData(
      `${BACKEND_URL}/defect/analysis/${analysisId}/status`,
      {
        method: "GET",
      }
    );
  },

  getAnalysisDetails: async (analysisId) => {
    return await fetchData(`${BACKEND_URL}/defect/analysis/${analysisId}`, {
      method: "GET",
    });
  },
};

export default DefectService;
