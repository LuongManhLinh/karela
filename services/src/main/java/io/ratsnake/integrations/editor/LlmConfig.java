package io.ratsnake.integrations.editor;

import io.ratsnake.llm.aiservice.DefectAIService;
import io.ratsnake.llm.aiservice.FormulationAIService;
import io.ratsnake.llm.models.GeminiDynamicModel;
import io.ratsnake.llm.prompt.DefectPrompt;
import io.ratsnake.llm.prompt.FormulationPrompt;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LlmConfig {

    @Bean
    public DefectAIService defectAIService() {
        var model = new GeminiDynamicModel<>(
                DefectPrompt.class,
                GeminiDynamicModel.GEMINI_2_0_FLASH,
                0.4
        );
        return new DefectAIService(model, 3);
    }

    @Bean
    public FormulationAIService formulationAIService() {
        var model = new GeminiDynamicModel<>(
                FormulationPrompt.class,
                GeminiDynamicModel.GEMINI_2_0_FLASH,
                0.4
        );
        return new FormulationAIService(model, 3);
    }
}
