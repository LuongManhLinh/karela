package io.ratsnake.integrations.server;

import io.ratsnake.llm.adapter.DefectAiAdapter;
import io.ratsnake.llm.adapter.DefectQAAdapter;
import io.ratsnake.llm.adapter.FormulationAiAdapter;
import io.ratsnake.llm.aiservice.DefectQAAiService;
import io.ratsnake.llm.models.GeminiDynamicModel;
import io.ratsnake.llm.aiservice.DefectAiService;
import io.ratsnake.llm.aiservice.FormulationAiService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LlmConfig {

    @Bean
    public DefectAiAdapter defectAIService() {
        var model = new GeminiDynamicModel<>(
                DefectAiService.class,
                GeminiDynamicModel.GEMINI_2_0_FLASH,
                0.1,
                false
        );
        return new DefectAiAdapter(model, 3);
    }

    @Bean
    public DefectQAAdapter defectQAService() {
        var model = new GeminiDynamicModel<>(
                DefectQAAiService.class,
                GeminiDynamicModel.GEMINI_2_0_FLASH_LITE,
                0.5,
                false
        );
        return new DefectQAAdapter(model, 3);
    }

    @Bean
    public FormulationAiAdapter formulationAIService() {
        var model = new GeminiDynamicModel<>(
                FormulationAiService.class,
                GeminiDynamicModel.GEMINI_2_0_FLASH_LITE,
                0.5,
                false
        );
        return new FormulationAiAdapter(model, 3);
    }
}
