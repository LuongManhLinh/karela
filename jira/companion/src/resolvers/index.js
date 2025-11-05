import Resolver from "@forge/resolver";
import DefectService from "./defectService";
import api, { route } from "@forge/api";

const resolver = new Resolver();

resolver.define("analyzeDefect", async ({ payload }) => {
  const result = await DefectService.analyzeWorkItems(payload.projectKey);
  return result;
});

resolver.define("getAllDefectAnalysisBriefs", async ({ payload }) => {
  const result = await DefectService.getAllAnalysisBriefs(payload.projectKey);
  return result;
});

resolver.define("getDefectAnalysisStatus", async ({ payload }) => {
  const result = await DefectService.getAnalysisStatus(payload.analysisId);
  return result;
});

resolver.define("getDefectAnalysisDetails", async ({ payload }) => {
  const result = await DefectService.getAnalysisDetails(payload.analysisId);
  return result;
});

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
