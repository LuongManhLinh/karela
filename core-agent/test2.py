from integrations.jira.client import default_client

default_client.modify_issue(
    issue_id="AF-1",
    title="Updated issue title",
)
