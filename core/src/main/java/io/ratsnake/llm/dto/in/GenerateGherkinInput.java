package io.ratsnake.llm.dto.in;

import io.ratsnake.dsl.schema.Gherkin;
import io.ratsnake.llm.dto.ContextInput;
import io.ratsnake.llm.dto.UserStoryDto;
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
