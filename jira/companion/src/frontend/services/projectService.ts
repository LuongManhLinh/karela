import { invoke, view } from "@forge/bridge";
import { ApiResponse } from "../../common/apiResponse";

const ProjectService = {
  getFirstScrumBoardUrl: async (): Promise<ApiResponse<string>> => {
    const context = await view.getContext();
    const projectKey = context.extension.project.key || "---";
    const response = await invoke("getFirstScrumBoardUrl", {
      projectId: projectKey,
    });
    return response as ApiResponse<string>;
  },
};

export default ProjectService;
