package io.ratsnake.llm.aiservice;

import io.ratsnake.llm.dto.GenerateGherkinInput;
import io.ratsnake.llm.dto.GenerateUserStoryInput;
import io.ratsnake.llm.dto.ImproveItemOutput;
import io.ratsnake.llm.models.DynamicModel;
import io.ratsnake.llm.prompt.DefectPrompt;

import static io.ratsnake.util.LanguageProcessor.jsonify;
import static io.ratsnake.util.LanguageProcessor.secureParseJson;

public class DefectAIService extends AIService<DefectPrompt> {
    public DefectAIService(
            DynamicModel<DefectPrompt> model,
            int maxRetries
    ) {
        super(model, maxRetries);
    }

    public DefectAIService(DynamicModel<DefectPrompt> model) {
        super(model);
    }


    public ImproveItemOutput improveUserStory(GenerateUserStoryInput input) {
        return executeWithRetries(() -> {
            String outputJson = model().improveUserStory(jsonify(input));
            return secureParseJson(
                    outputJson,
                    ImproveItemOutput.class
            );
        }, "IMPROVE_USER_STORY");
    }


    public ImproveItemOutput improveGherkin(GenerateGherkinInput input) {
        return executeWithRetries(() -> {
            String outputJson = model().improveGherkin(jsonify(input));
            return secureParseJson(
                    outputJson,
                    ImproveItemOutput.class
            );
        }, "IMPROVE_GHERKIN");
    }


}
