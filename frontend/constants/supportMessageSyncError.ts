import { ConnectionSyncError } from "@/types/integration";

export const getSupportMessageForSyncError = (
  errorType: ConnectionSyncError
): string => {
  switch (errorType) {
    case "data_sync_error":
      return "Try reconnecting your integration or deleting and re-adding it to resolve data synchronization issues.";
    case "auth_error":
      return "Please check your authentication credentials and ensure they are correct.";
    case "webhook_error":
      return `Try reconnecting your integration or deleting and re-adding it to resolve webhook issues. 
      If the problem persists, you can manually create your own webhook in your Jira instance following our guide.`;
    case "issue_type_error":
      return `Try reconnecting your integration or deleting and re-adding it to resolve issue type issues. 
      If the problem persists, you can manually create the required issue types in your Jira instance following our guide.`;
    case "issue_type_scheme_error":
      return `Try reconnecting your integration or deleting and re-adding it to resolve issue type issues. 
      If the problem persists, you can manually add the required issue types to the issue type scheme in your Jira instance following our guide.`;
    case "unknown_error":
    default:
      return "Please contact support for further assistance.";
  }
};
