import Resolver from "@forge/resolver";
import api, { route, getAppContext } from "@forge/api";

import { BACKEND_URL } from "./backendUrl";

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

const resolver = new Resolver();

resolver.define("getAllDefectAnalysisSummaries", async ({ payload }) => {
  const result = await fetchData(
    `${BACKEND_URL}/defects/analyses/${payload.projectKey}`,
    {
      method: "GET",
    }
  );
  return result;
});

resolver.define("getDefectAnalysisDetails", async ({ payload }) => {
  const result = await fetchData(
    `${BACKEND_URL}/defects/analyses/${payload.analysisId}/details`,
    {
      method: "GET",
    }
  );
  return result;
});

resolver.define("analyzeDefect", async ({ payload }) => {
  const result = await fetchData(`${BACKEND_URL}/defects/analyses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project_key: payload.projectKey,
      analysis_type: payload.analysisType,
      target_story_key: payload.targetStoryKey || null,
    }),
  });
  return result;
});

resolver.define("getDefectAnalysisStatus", async ({ payload }) => {
  const result = await fetchData(
    `${BACKEND_URL}/defects/analyses/${payload.analysisId}/status`,
    {
      method: "GET",
    }
  );
  return result;
});

resolver.define("changeDefectSolved", async ({ payload }) => {
  const result = await fetchData(
    `${BACKEND_URL}/defects/defects/${payload.defectId}/solve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        solved: payload.solved,
      }),
    }
  );
  return result;
});

resolver.define("createChatSession", async ({ payload }) => {
  const body = {
    project_key: payload.projectKey,
    user_message: payload.userMessage,
    story_key: payload.storyKey,
  };
  const result = await fetchData(`${BACKEND_URL}/defects/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return result;
});

resolver.define("getChatSessionByProjectAndStory", async ({ payload }) => {
  const result = await fetchData(
    `${BACKEND_URL}/defects/chat/projects/${payload.projectKey}/stories${
      payload.storyKey ? "/" + payload.storyKey : ""
    }`,
    {
      method: "GET",
    }
  );
  return result;
});

resolver.define("getChatSession", async ({ payload }) => {
  const result = await fetchData(
    `${BACKEND_URL}/defects/chat/${payload.sessionId}`,
    {
      method: "GET",
    }
  );
  return result;
});

resolver.define("getChatMessagesAfter", async ({ payload }) => {
  const result = await fetchData(
    `${BACKEND_URL}/defects/chat/${payload.sessionId}/messages/${payload.messageId}`,
    {
      method: "GET",
    }
  );
  return result;
});

resolver.define("postChatMessage", async ({ payload }) => {
  const body = {
    message: payload.message,
    project_key: payload.projectKey,
    story_key: payload.storyKey,
  };
  const result = await fetchData(
    `${BACKEND_URL}/defects/chat/${payload.sessionId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  return result;
});

const PROP_KEY = "karela-companion-settings";

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
      errors: [`Error fetching project settings: ${res.status}`],
    };
  } else {
    const data = await res.json();

    return { data: data.value, errors: null };
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
      errors: [`Error saving project settings: ${res.status}`],
    };
  }
  return { data: null, errors: null };
});

resolver.define("getFirstScrumBoardUrl", async ({ payload }) => {
  const { projectKey } = payload;
  const result = await api
    .asApp()
    .requestJira(
      route`/rest/agile/1.0/board?projectKeyOrId=${projectKey}&type=scrum`
    );
  if (!result.ok) {
    return { data: null, errors: [`Error fetching boards: ${result.status}`] };
  } else {
    const data = await result.json();
    if (data.values && data.values.length > 0) {
      const siteUrl = getAppContext().siteUrl;
      return {
        data: `${siteUrl}/jira/software/c/projects/${projectKey}/boards/${data.values[0].id}`,
        error: null,
      };
    } else {
      return {
        data: null,
        errors: ["No scrum boards found for this project."],
      };
    }
  }
});

export const handler = resolver.getDefinitions();
