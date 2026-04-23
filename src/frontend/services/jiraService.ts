import { getToken } from "@/utils/jwtUtils";
import apiClient from "./api";

export const jiraService = {
  startOAuth: async (): Promise<void> => {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

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
        // window.open(redirectUrl, "_blank", "noopener,noreferrer");
        // Open in the current tab, not a new one
        window.location.href = redirectUrl;
        return;
      } else {
        throw new Error(`Blank Redirect URL`);
      }
    }
  },
};
