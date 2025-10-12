package io.ratsnake.integrations.editor;

import io.ratsnake.llm.aiservice.DefectAIService;
import io.ratsnake.llm.aiservice.FormulationAIService;
import io.ratsnake.llm.dto.GenerateGherkinInput;
import io.ratsnake.llm.dto.GenerateGherkinOutput;
import io.ratsnake.llm.dto.GenerateUserStoryInput;
import io.ratsnake.llm.dto.ImproveItemOutput;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LlmService {
    @Autowired
    private DefectAIService defectAIService;

    @Autowired
    private FormulationAIService formulationAIService;

    public ImproveItemOutput improveUserStory(GenerateUserStoryInput input) {
        return defectAIService.improveUserStory(input);
    }

    public ImproveItemOutput improveGherkin(GenerateGherkinInput input) {
        return defectAIService.improveGherkin(input);
    }

    public GenerateGherkinOutput suggestWhileWritingGherkin(GenerateGherkinInput input) {
        return formulationAIService.suggestWhileWritingGherkin(input);
    }
}
