package io.ratsnake.llm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GenerateUserStoryInput {
    private ContextInput context;
    private UserStoryDto userStory;

    public static final String BEING_WRITTEN_TOKEN = "<...>";
}
