import { invoke, view } from "@forge/bridge";
import { ApiResponse } from "../../common/apiResponse";
import {
  AnalysisSummary as AnalysisSummary,
  AnalysisDetailDto,
} from "../types/defect";

export const DefectService = {
  getAllDefectAnalysisSummaries: async (): Promise<
    ApiResponse<AnalysisSummary[]>
  > => {
    const context = await view.getContext();
    const projectKey = context.extension.project.key;
    if (!projectKey) {
      return {
        data: null,
        errors: ["Project key is undefined"],
      };
    }
    const result = await invoke("getAllDefectAnalysisSummaries", {
      projectKey: projectKey,
    });
    return result as ApiResponse<AnalysisSummary[]>;
  },

  getDefectAnalysisDetails: async (
    analysisId: string
  ): Promise<ApiResponse<AnalysisDetailDto>> => {
    const result = await invoke("getDefectAnalysisDetails", { analysisId });
    return result as ApiResponse<AnalysisDetailDto>;
  },

  analyzeDefects: async (storyKey?: string): Promise<ApiResponse<string>> => {
    const context = await view.getContext();
    const projectKey = context.extension.project.key;
    if (!projectKey) {
      return {
        data: null,
        errors: ["Project key is undefined"],
      };
    }

    const result = await invoke("analyzeDefect", {
      projectKey: projectKey,
      targetStoryKey: storyKey,
    });
    // const result = { data: null, error: "Not implemented" };
    return result as ApiResponse<string>;
  },

  getDefectAnalysisStatus: async (
    analysisId: string
  ): Promise<ApiResponse<string>> => {
    const result = await invoke("getDefectAnalysisStatus", { analysisId });
    return result as ApiResponse<string>;
  },
  changeDefectSolved: async (
    defectId: string,
    solved: boolean
  ): Promise<ApiResponse<null>> => {
    const result = await invoke("changeDefectSolved", {
      defectId,
      solved,
    });
    return result as ApiResponse<null>;
  },
};

export const MockDefectService = {
  getAllDefectAnalysisSummaries: async (): Promise<
    ApiResponse<AnalysisSummary[]>
  > => {
    return {
      data: [
        {
          id: "analysis-001",
          status: "DONE",
          ended_at: "2025-11-13T21:27:24.060000",
          started_at: "2025-11-13T14:27:13.120000",
          type: "SECURITY",
        },
        {
          id: "analysis-002",
          status: "IN_PROGRESS",
          started_at: "2025-11-13T10:30:00Z",
          ended_at: null,
          type: "PERFORMANCE",
        },
        {
          id: "analysis-003",
          status: "FAILED",
          started_at: "2025-11-13T08:00:00Z",
          ended_at: "2025-11-13T08:05:00Z",
          type: "QUALITY",
        },
      ],
      errors: null,
    };
  },

  getDefectAnalysisDetails: async (
    analysisId: string
  ): Promise<ApiResponse<AnalysisDetailDto>> => {
    return {
      data: {
        id: analysisId,
        defects: [
          {
            id: "defect-001",
            type: "SQL_INJECTION",
            severity: "HIGH",
            explanation:
              "User input is not properly sanitized before being used in SQL queries, potentially allowing SQL injection attacks.",
            confidence: 0.95,
            suggested_fix:
              "Use parameterized queries or prepared statements to prevent SQL injection vulnerabilities.",
            solved: false,
            work_item_keys: ["DEMO-123", "DEMO-124"],
          },
          {
            id: "defect-002",
            type: "NULL_POINTER",
            severity: "MEDIUM",
            explanation:
              "Method getUserById() may return null without proper null checks in the calling code.",
            confidence: 0.87,
            suggested_fix:
              "Add null checks before using the returned user object, or use Optional<User> as return type.",
            solved: true,
            work_item_keys: ["DEMO-125"],
          },
          {
            id: "defect-003",
            type: "PERFORMANCE",
            severity: "LOW",
            explanation:
              "Database query in loop causes N+1 query problem, leading to poor performance with large datasets.",
            confidence: 0.78,
            suggested_fix:
              "Use batch queries or join operations to fetch all required data in a single query.",
            solved: false,
            work_item_keys: ["DEMO-126", "DEMO-127"],
          },
        ],
      },
      errors: null,
    };
  },

  analyzeDefects: async (storyKey?: string): Promise<ApiResponse<string>> => {
    return {
      data: "analysis-" + Math.floor(Math.random() * 1000),
      errors: null,
      message: `Analysis started for ${
        storyKey ? `story ${storyKey}` : "project"
      }. Analysis ID has been generated.`,
    };
  },

  getDefectAnalysisStatus: async (
    analysisId: string
  ): Promise<ApiResponse<string>> => {
    const statuses = ["PENDING", "IN_PROGRESS", "DONE", "FAILED"];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      data: randomStatus,
      errors: null,
    };
  },

  changeDefectSolved: async (
    defectId: string,
    solved: boolean
  ): Promise<ApiResponse<null>> => {
    return {
      data: null,
      errors: null,
      message: `Defect ${defectId} marked as ${
        solved ? "solved" : "unsolved"
      } successfully.`,
    };
  },
};
