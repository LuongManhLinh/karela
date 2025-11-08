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

resolver.define("changeDefectSolved", async ({ payload }) => {
  const result = await DefectService.changeDefectSolved(payload.defectId, {
    solved: payload.solved,
  });
  return result;
});

const PROP_KEY = "ratsnake-companion-settings";

resolver.define("getProjectSettings", async ({ payload }) => {
  const { projectId } = payload;
  const res = await api
    .asApp()
    .requestJira(
      route`/rest/api/3/project/${projectId}/properties/${PROP_KEY}`
    );
  if (!res.ok) {
    return {
      data: null,
      error: `Error fetching project settings: ${res.status}`,
    };
  } else {
    const data = await res.json();

    return { data: data.value, error: null };
  }
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
  if (!res.ok) {
    return {
      data: null,
      error: `Error saving project settings: ${res.status}`,
    };
  }
  return { data: null, error: null };
});

export const handler = resolver.getDefinitions();
