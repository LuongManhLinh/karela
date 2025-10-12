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
public class IssuesCreateRequest {
    private List<IssueUpdate> issueUpdates;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class IssueUpdate {
        private Fields fields;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class Fields {
        private Project project;
        private IssueType issuetype;
        private String summary;
        private Object description;
    }
}
