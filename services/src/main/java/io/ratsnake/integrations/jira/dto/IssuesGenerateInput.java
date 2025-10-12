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
public class IssuesGenerateInput {
    private int numberOfIssuesToGenerate;
    private String projectDescription;
    private List<String> glossary;
    private List<String> constraints;
    private List<LlmProcessedIssue> existingIssues;
}
