package io.ratsnake.integrations.jira.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LlmProcessedIssue {
    private String issueType;
    private String summary;
    private String description;
}
