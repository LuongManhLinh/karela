package io.ratsnake.llm.models;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiStreamingChatModel;
import dev.langchain4j.service.AiServices;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Random;


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
            apiKeys = Files.readAllLines(Path.of("external/GEMINI_API_KEYS"));
        } catch (IOException e) {
            apiKeys = List.of();
        }
        API_KEYS = apiKeys;
    }

    private int currentIndex;
    private final String modelName;
    private final double temperature;
    private final boolean streaming;
    private Object chatModel;
    private final A model;

    public GeminiDynamicModel(Class<A> modelClass, String modelName, double temperature, boolean streaming) {
        this.modelName = modelName;
        this.temperature = temperature;
        this.streaming = streaming;

        currentIndex = new Random().nextInt(API_KEYS.size());
        roll();

        model = streaming ?
                AiServices.builder(modelClass)
                        .streamingChatModel((StreamingChatModel) chatModel)
                        .build()
                :
                AiServices.builder(modelClass)
                        .chatModel((ChatModel) chatModel)
                        .build();

    }

    @Override
    public void roll() {
        currentIndex = (currentIndex + 1) % API_KEYS.size();
        String apiKey = API_KEYS.get(currentIndex);
        System.out.println("Switched to API key: " + apiKey.substring(0, 4) + "****" + apiKey.substring(apiKey.length() - 4));
        chatModel = streaming ?
                GoogleAiGeminiStreamingChatModel.builder()
                        .apiKey(apiKey)
                        .modelName(modelName)
                        .temperature(temperature)
                        .build()
                :
                GoogleAiGeminiChatModel.builder()
                        .apiKey(apiKey)
                        .modelName(modelName)
                        .temperature(temperature)
                        .build();
    }

    @Override
    public A get() {
        return model;
    }
}
