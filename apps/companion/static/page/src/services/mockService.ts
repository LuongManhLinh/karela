import dayjs from "dayjs";
import type { AnalysisPayload } from "../types";

export const MockApi = {
  async fetchAnalysis(): Promise<AnalysisPayload> {
    await delay(300); // simulate latency
    return {
      avatarInitials: "A",
      analysisMessage: undefined,
      markdown: `# Defect description:\n\n- Those are Markdown\n- Rendered from Markdown content\n- So many description here\n- Here too\n\n## Suggestions:\n\n- [ ] Check Description of Story US-122\n- [ ] Change \"Fast\" into \"2 seconds\" in Task TS-109\n- [ ] Change \"Fast\" into \"2 seconds\" in Task TS-109`,
      suggestions: [
        { id: "s1", text: "Check Description of Story US-122", done: true },
        {
          id: "s2",
          text: "Change “Fast” into “2 seconds” in Task TS-109",
          done: false,
        },
        {
          id: "s3",
          text: "Change “Fast” into “2 seconds” in Task TS-109",
          done: false,
        },
      ],
      history: Array.from({ length: 20 }).map((_, i) => ({
        id: `h${i + 1}`,
        title: i === 0 ? "Analyzer xyz" : `Analysis ${i + 1}`,
        timestamp: dayjs().subtract(i, "minute").toISOString(),
      })),
    };
  },

  async executeSuggestion(id: string): Promise<{ success: boolean }> {
    console.log("Execute suggestion", id);
    await delay(600);
    return { success: true };
  },

  async completeAll(ids: string[]): Promise<{ success: boolean }> {
    console.log("Complete all", ids);
    await delay(900);
    return { success: true };
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
