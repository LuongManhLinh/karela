package io.ratsnake.llm.aiservice;

import io.ratsnake.llm.dto.GenerateGherkinInput;
import io.ratsnake.llm.dto.GenerateGherkinOutput;
import io.ratsnake.llm.models.DynamicModel;
import io.ratsnake.llm.prompt.FormulationPrompt;

import static io.ratsnake.util.LanguageProcessor.jsonify;
import static io.ratsnake.util.LanguageProcessor.secureParseJson;


public class FormulationAIService extends AIService<FormulationPrompt> {
    public FormulationAIService(
            DynamicModel<FormulationPrompt> model,
            int maxRetries
    ) {
        super(model, maxRetries);
    }

    public FormulationAIService(DynamicModel<FormulationPrompt> model) {
        super(model);
    }

    public GenerateGherkinOutput suggestWhileWritingGherkin(GenerateGherkinInput input) {
        return executeWithRetries(() -> {
            String outputJson = model().suggestWhileWritingGherkin(jsonify(input));
            return secureParseJson(
                    outputJson,
                    GenerateGherkinOutput.class
            );
        }, "GENERATE_GHERKIN");
    }

}
