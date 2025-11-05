package io.ratsnake.llm.adapter;

import io.ratsnake.llm.dto.in.GenerateGherkinInput;
import io.ratsnake.llm.dto.out.GenerateGherkinOutput;
import io.ratsnake.llm.models.DynamicModel;
import io.ratsnake.llm.aiservice.FormulationAiService;

import static io.ratsnake.util.LanguageProcessor.*;


public class FormulationAiAdapter extends AiAdapter<FormulationAiService> {
    public FormulationAiAdapter(DynamicModel<FormulationAiService> model) {
        super(model);
    }

    public GenerateGherkinOutput suggestWhileWritingGherkin(GenerateGherkinInput input) {
        return model().suggestWhileWritingGherkin(safeJsonify(input));
    }

}
