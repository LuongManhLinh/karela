package io.ratsnake.llm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DetectDefectOutput {
    private List<Issue> issues;
    private Double confidence;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Issue {
        private String type;
        private List<String> userStoryIds;
        private String severity;
        private String explanation;
        private String suggestedImprovements;
    }
}
