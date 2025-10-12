package io.ratsnake.integrations.jira.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
