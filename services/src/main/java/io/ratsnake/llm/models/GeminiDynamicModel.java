package io.ratsnake.llm.models;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.service.AiServices;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;


public class GeminiDynamicModel<A> implements DynamicModel<A> {
    public static final String GEMINI_2_0_FLASH = "gemini-2.0-flash";
    public static final String GEMINI_2_0_FLASH_LITE = "gemini-2.0-flash-lite";
    public static final String GEMINI_2_5_FLASH = "gemini-2.5-flash";
    public static final String GEMINI_2_5_FLASH_LITE = "gemini-2.5-flash-lite";
    public static final String GEMINI_2_5_PRO = "gemini-2.5-pro";

    private static final List<String> API_KEYS;
    static {
        List<String> apiKeys;
        try {
            apiKeys = Files.readAllLines(Path.of("external/API_KEYS"));
        } catch (IOException e) {
            apiKeys = List.of();
        }
        API_KEYS = apiKeys;
    }

    private int currentIndex = 0;
    private final String modelName;

    private ChatModel chatModel;
    private final A model;

    public GeminiDynamicModel(Class<A> modelClass, String modelName, Double temperature) {
        this.modelName = modelName;

        String apiKey = API_KEYS.get(currentIndex);
        chatModel = GoogleAiGeminiChatModel.builder()
                .apiKey(apiKey)
                .modelName(modelName)
                .temperature(temperature)
                .build();

        model = AiServices.builder(modelClass)
                .chatModel(chatModel)
                .build();
    }

    @Override
    public void roll() {
        currentIndex = (currentIndex + 1) % API_KEYS.size();
        String apiKey = API_KEYS.get(currentIndex);
        chatModel = GoogleAiGeminiChatModel.builder()
                .apiKey(apiKey)
                .modelName(modelName)
                .build();
    }

    @Override
    public A get() {
        return model;
    }
}
