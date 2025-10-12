package io.ratsnake.integrations.jira.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class IssuesGenerateOutput {
    private List<LlmProcessedIssue> issues;
}
