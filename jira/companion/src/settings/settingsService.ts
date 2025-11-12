import { invoke, view } from "@forge/bridge";
import { ApiResponse } from "../common/apiResponse";
import { ProjectSettings } from "./types";

const SettingsService = {
  getProjectSettings: async (): Promise<ApiResponse<ProjectSettings>> => {
    const context = await view.getContext();
    const projectId = context.extension.project.id || "---";
    console.log("Fetched context", context);
    console.log("Project ID:", projectId);

    const result = await invoke("getProjectSettings", {
      projectId,
    });

    console.log("Fetched project settings:", result);
    return result as ApiResponse<ProjectSettings>;
  },

  setProjectSettings: async (
    settings: ProjectSettings
  ): Promise<ApiResponse<null>> => {
    const context = await view.getContext();
    const projectId = context.extension.project.id || "---";

    // Jira API expects {"value": "<string>"}, so we need to wrap the stringified settings
    const result = await invoke("setProjectSettings", {
      projectId,
      settings,
    });
    return result as ApiResponse<null>;
  },
};

export default SettingsService;
