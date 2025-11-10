import Resolver from "@forge/resolver";
import DefectService from "./defectService";
import api, { route, getAppContext } from "@forge/api";

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

resolver.define("getFirstScrumBoardUrl", async ({ payload }) => {
  const { projectKey } = payload;
  const result = await api
    .asApp()
    .requestJira(
      route`/rest/agile/1.0/board?projectKeyOrId=${projectKey}&type=scrum`
    );
  if (!result.ok) {
    return { data: null, error: `Error fetching boards: ${result.status}` };
  } else {
    const data = await result.json();
    if (data.values && data.values.length > 0) {
      const siteUrl = getAppContext().siteUrl;
      return {
        data: `${siteUrl}/jira/software/c/projects/${projectKey}/boards/${data.values[0].id}`,
        error: null,
      };
    } else {
      return { data: null, error: "No scrum boards found for this project." };
    }
  }
});

export const handler = resolver.getDefinitions();
