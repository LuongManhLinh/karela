package io.ratsnake.llm.adapter;

import io.ratsnake.llm.dto.GenerateGherkinInput;
import io.ratsnake.llm.dto.GenerateGherkinOutput;
import io.ratsnake.llm.models.DynamicModel;
import io.ratsnake.llm.aiservice.FormulationAiService;

import static io.ratsnake.util.LanguageProcessor.secureParseJson;


public class FormulationAiAdapter extends AiAdapter<FormulationAiService> {
    public FormulationAiAdapter(
            DynamicModel<FormulationAiService> model,
            int maxRetries
    ) {
        super(model, maxRetries);
    }

    public FormulationAiAdapter(DynamicModel<FormulationAiService> model) {
        super(model);
    }

    public GenerateGherkinOutput suggestWhileWritingGherkin(GenerateGherkinInput input) {
        return executeWithRetries(
                input,
                GenerateGherkinOutput.class,
                model()::suggestWhileWritingGherkin,
                "SUGGEST_WHILE_WRITING_GHERKIN"
        );
    }

}
