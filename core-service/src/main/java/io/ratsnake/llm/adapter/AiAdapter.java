package io.ratsnake.llm.adapter;

import io.ratsnake.llm.models.DynamicModel;
import lombok.AllArgsConstructor;

import static io.ratsnake.util.LanguageProcessor.safeParseJson;

@AllArgsConstructor
public class AiAdapter<AS> {
    private final DynamicModel<AS> model;

    public AS model() {
        return model.get();
    }
}
