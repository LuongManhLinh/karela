package io.ratsnake.integrations.jira.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Issue {
    private String id;
    private String key;
    private Fields fields;
    private RenderedFields renderedFields;
}
