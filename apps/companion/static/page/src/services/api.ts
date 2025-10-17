// import { invoke } from "@forge/bridge";
import type { AnalysisPayload, DefectResponse, FetchResult } from "../types";
import { MockApi } from "./mockService";
// import { invoke, view } from "@forge/bridge";

export const Api = {
  async fetchAnalysisByHistoryId(
    id: string
  ): Promise<FetchResult<AnalysisPayload>> {
    try {
      // const result = (await invoke("getAnalysis", { id })) as any;
      // // In real use, transform result into AnalysisPayload
      // // Fallback to mock if the shape isn't correct
      // if (!result || result.ok !== true) {
      //   throw new Error("invoke failed");
      // }
      // Just vary the mock slightly by id for demo
      const mock = await MockApi.fetchAnalysis();
      return {
        data: {
          ...mock,
          history: mock.history,
          avatarInitials: String(id).slice(0, 1).toUpperCase(),
        },
        hadError: false,
      };
    } catch (e) {
      return { data: await MockApi.fetchAnalysis(), hadError: true };
    }
  },

  async fetchDefectAnalysis(): Promise<FetchResult<DefectResponse>> {
    try {
      // const params = new URLSearchParams({
      //   projectKey,
      // });
      // const url =
      //   "http://localhost:8080/api/llm/defect/analyze" +
      //   "?" +
      //   params.toString();
      // console.log("Fetching defect analysis from", url);
      // const response = await fetch(url, {
      //   method: "GET",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });
      // const data = await response.json();
      // return { data, hadError: false };

      // const context = await view.getContext();
      // const projectKey = context.extension.project.key;
      // console.log("Fetching defect analysis for project", projectKey);
      // console.log("Project context:", context);
      // const result = await invoke("analyzeDefect", { projectKey });
      // return result as FetchResult<DefectResponse>;

      // Simulate latency
      await Promise.resolve().then(
        () => new Promise((r) => setTimeout(r, 2000))
      );
      return {
        data: {
          notification: "This is a mock defect analysis.",
          report: {
            title: "Mock Defect Report",
            content: `
# Mock Defect Report
This is a mock defect report.
---
## Summary
- Total Defects: 2
- High Severity: 0
            `,
            suggestions: ["Mock suggestion 1", "Mock suggestion 2"],
          },
          defects: [
            {
              defects: [
                {
                  type: "MockDefectType",
                  workItemIds: ["MOCK-1", "MOCK-2"],
                  severity: "Medium",
                  explanation: "This is a mock defect explanation.",
                  suggestedImprovements: [
                    "This is a mock suggested improvement.",
                  ],
                },
              ],
              confidence: 0.75,
            },
          ],
        },
        hadError: false,
      };
    } catch (e) {
      return { data: null, hadError: true };
    }
  },
};
