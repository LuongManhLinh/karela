import apiClient from "./api";
import { BasicResponse } from "@/types";

export const jiraService = {
  startOAuth: async (): Promise<void> => {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8888/api/v1";

    // Use fetch with redirect: "manual" to intercept the redirect response
    // The backend will return a 302/307 redirect with Location header
    const response = await fetch(
      `${apiBaseUrl}/integrations/jira/oauth/start`,
      {
        method: "GET",
        redirect: "manual",
      },
    );

    // If we get here, something went wrong
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to start OAuth flow: ${response.status} ${errorText}`,
      );
    } else {
      const data = await response.json();
      const redirectUrl = data.data;
      console.log("Redirect URL:", redirectUrl);
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      } else {
        throw new Error(`Blank Redirect URL`);
      }
    }
  },

  retrySetup: async (): Promise<BasicResponse> => {
    const response = await apiClient.post<BasicResponse<void>>(
      `/integrations/jira/setup`,
    );

    return response.data;
  },
};
