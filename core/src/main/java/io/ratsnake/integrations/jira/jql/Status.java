package io.ratsnake.integrations.jira.jql;

public enum Status {
    TO_DO("To Do"),
    IN_PROGRESS("In Progress"),
    DONE("Done"),
    BACKLOG("Backlog"),
    SELECTED_FOR_DEVELOPMENT("Selected for Development"),
    REVIEW("Review"),
    TESTING("Testing");
    private final String text;
    Status(String text) { this.text = text; }
    public String text() { return text; }
}
