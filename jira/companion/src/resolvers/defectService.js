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
};

export default DefectService;
