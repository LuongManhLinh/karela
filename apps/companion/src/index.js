import Resolver from "@forge/resolver";
import api, { route } from "@forge/api";
const resolver = new Resolver();

// Example passthrough to external backend for analysis data
resolver.define("analyzeDefect", async ({ payload }) => {
  try {
    const base = "https://exclusive-cayman-wishing-sender.trycloudflare.com";
    const url = `${base}/api/llm/defect/analyze?projectKey=${payload.projectKey}`;
    const res = await api.fetch(url, { method: "GET" });
    if (!res.ok) {
      return { data: null, hadError: true };
    }
    const data = await res.json();
    return { data, hadError: false };
  } catch (e) {
    return { data: null, hadError: true };
  }
});

// ---------------- Project Settings Handlers ----------------
// Settings structure stored under a Jira project property key
// We follow the user's provided sample closely to ensure compatibility
const PROP_KEY = "re-llm-settings";

// type Settings = {
//   enableLLM: boolean;
//   coverageThreshold: number;
//   productVision?: string;
//   productScope?: string;
//   sprintGoals?: string;
//   glossary?: string;
//   constraints?: string;
//   llmGuidelines?: string;
//   extraDocs?: Array<{ id: string; title: string; content: string }>; // user-defined documents
// };

resolver.define("getProjectSettings", async ({ payload }) => {
  const { projectId } = payload;
  const res = await api
    .asApp()
    .requestJira(
      route`/rest/api/3/project/${projectId}/properties/${PROP_KEY}`
    );

  if (res.status === 404) {
    return { enableLLM: true, coverageThreshold: 70 };
  }
  if (!res.ok) throw new Error(`Get settings failed: ${res.status}`);
  const body = await res.json();
  return body.value;
});

resolver.define("setProjectSettings", async ({ payload }) => {
  const { projectId, settings } = payload;
  const res = await api
    .asApp()
    .requestJira(
      route`/rest/api/3/project/${projectId}/properties/${PROP_KEY}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }
    );
  if (!res.ok)
    throw new Error(`Set settings failed: ${res.status} ${await res.text()}`);
  return { ok: true };
});

export const handler = resolver.getDefinitions();
