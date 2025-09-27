package io.ratsnake.llm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ContextInput {
    private List<String> projectGlossary;
    private List<String> styleRules;
    private List<String> constraints;
    private Map<String, Object> additionalContext;
}
