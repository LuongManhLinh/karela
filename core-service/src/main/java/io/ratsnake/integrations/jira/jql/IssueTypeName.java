package io.ratsnake.integrations.jira.jql;

public enum     IssueTypeName {
    STORY("Story"),
    TASK("Task"),
    BUG("Bug"),
    EPIC("Epic"),
    SUB_TASK("Sub-task");
    private final String text;
    IssueTypeName(String text) { this.text = text; }
    public String text() { return text; }
}
