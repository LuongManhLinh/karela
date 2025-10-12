package io.ratsnake.integrations.jira.jql;

public enum Field {
    PROJECT("project"),
    ISSUE_TYPE("issuetype"),
    STATUS("status"),
    ASSIGNEE("assignee"),
    REPORTER("reporter"),
    SUMMARY("summary"),
    DESCRIPTION("description"),
    LABELS("labels"),
    PRIORITY("priority"),
    CREATED("created"),
    UPDATED("updated"),
    DUEDATE("duedate"),
    FIX_VERSION("fixVersion"),
    AFFECTS_VERSION("affectedVersion"),
    SPRINT("Sprint"); // Note: this is often a custom field under the hood

    private final String text;
    Field(String text) { this.text = text; }
    public String text() { return text; }
}
