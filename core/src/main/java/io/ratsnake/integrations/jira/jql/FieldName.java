package io.ratsnake.integrations.jira.jql;

public enum FieldName {
    PROJECT("project"),
    ISSUE_TYPE("issuetype"),
    ISSUE_LINKS("issuelinks"),
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
    FieldName(String text) { this.text = text; }
    public String text() { return text; }
}
