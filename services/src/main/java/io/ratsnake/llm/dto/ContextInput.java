package io.ratsnake.llm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ContextInput {
    private Documentation documentation;
    private String guidelines;
    private Map<String, Object> additionalContext;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Documentation {
        private String productVision;
        private String productScope;
        private String sprintGoals;
        private String glossary;
        private String constraints;
        private Map<String, String> otherDocuments;
    }
}
