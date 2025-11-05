package io.ratsnake.integrations.server.service;

import io.ratsnake.llm.adapter.DefectAiAdapter;
import io.ratsnake.llm.adapter.FormulationAiAdapter;
import io.ratsnake.llm.dto.in.GenerateGherkinInput;
import io.ratsnake.llm.dto.in.GenerateUserStoryInput;
import io.ratsnake.llm.dto.out.GenerateGherkinOutput;
import io.ratsnake.llm.dto.out.ImproveItemOutput;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FormulationService {
    @Autowired
    private final DefectAiAdapter defectAiAdapter;

    @Autowired
    private final FormulationAiAdapter formulationAiAdapter;

    public ImproveItemOutput improveUserStory(GenerateUserStoryInput input) {
        return defectAiAdapter.improveStructuredUserStory(input);
    }

    public ImproveItemOutput improveGherkin(GenerateGherkinInput input) {
        return defectAiAdapter.improveStructuredGherkin(input);
    }

    public GenerateGherkinOutput suggestWhileWritingGherkin(GenerateGherkinInput input) {
        return formulationAiAdapter.suggestWhileWritingGherkin(input);
    }
}
