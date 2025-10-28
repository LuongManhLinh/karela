package io.ratsnake.integrations.jira.dto;

import io.ratsnake.integrations.jira.JiraApiService;
import io.ratsnake.integrations.jira.jql.FieldName;
import io.ratsnake.integrations.jira.jql.IssueTypeName;
import io.ratsnake.integrations.jira.jql.Jql;
import io.ratsnake.integrations.jira.jql.Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static io.ratsnake.util.LanguageProcessor.jsonify;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Fields {
    private Project project;
    private String summary;
    private IssueType issuetype;
    private Object description;
    private Priority priority;
    private Status status;
    private List<Map<String, Object>> issuelinks;
}
