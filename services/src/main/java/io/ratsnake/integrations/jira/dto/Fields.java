package io.ratsnake.integrations.jira.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

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
