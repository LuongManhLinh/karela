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
public class GenerateUserStoryOutput {
    private UserStoryDto userStory;
    private List<Lint> lints;
    private Double confidence; // Confidence score between 0.0 and 1.0
    private String explanation; // Explanation for the confidence score

    public static final String START_SUGGESTION_TOKEN = "<|s|>";
    public static final String END_SUGGESTION_TOKEN = "<|e|>";
}
