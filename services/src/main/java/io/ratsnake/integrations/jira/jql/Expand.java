package io.ratsnake.integrations.jira.jql;

public enum Expand {
    RENDERED_FIELDS("renderedFields");

    private final String text;
    Expand(String text) { this.text = text; }
    public String text() { return text; }
}
