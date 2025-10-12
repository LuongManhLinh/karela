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
public class SearchRequest {
    private String jql;
    private Integer maxResults;
    private List<String> fields;

    @Builder.Default
    private String expand = "";
}
