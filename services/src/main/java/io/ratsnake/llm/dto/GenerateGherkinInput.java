package io.ratsnake.llm.dto;

import io.ratsnake.dsl.schema.Gherkin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GenerateGherkinInput {
    private ContextInput context;
    private UserStoryDto userStory;
    private Gherkin gherkin;
}
