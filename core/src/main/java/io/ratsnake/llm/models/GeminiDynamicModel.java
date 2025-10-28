package io.ratsnake.llm.models;

import dev.langchain4j.exception.HttpException;
import dev.langchain4j.exception.RateLimitException;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.service.AiServices;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Random;

import static dev.langchain4j.model.chat.Capability.RESPONSE_FORMAT_JSON_SCHEMA;


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
    private ChatModel chatModel;
    private final A model;

    public GeminiDynamicModel(Class<A> modelClass, String modelName, double temperature, int maxRetries) {
        this.modelName = modelName;
        this.temperature = temperature;

        currentIndex = new Random().nextInt(API_KEYS.size());
        roll();

        var internalModel = AiServices.builder(modelClass)
                        .chatModel(chatModel)
                        .build();

        model = modelRetryWrap(internalModel, modelClass, maxRetries, error -> {
            if (error instanceof HttpException httpEx) {
                int status = httpEx.statusCode();
                if (status == 429) {
                    System.out.println("Rate limit exceeded, rolling to next API key.");
                    roll();
                } else if (status >= 500) {
                    System.out.println("Server error (" + status + "), retrying with the same API key after a short delay.");
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                }
                return true;
            } else if (error instanceof RateLimitException) {
                System.out.println("Rate limit exceeded, rolling to next API key.");
                roll();
                return true;
            } else {
                return false;
            }
        });

    }

    @Override
    public void roll() {
        currentIndex = (currentIndex + 1) % API_KEYS.size();
        String apiKey = API_KEYS.get(currentIndex);
        System.out.println("Switched to API key: " + apiKey.substring(0, 4) + "****" + apiKey.substring(apiKey.length() - 4));
        chatModel = GoogleAiGeminiChatModel.builder()
                        .apiKey(apiKey)
                        .modelName(modelName)
                        .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA)
                        .temperature(temperature)
                        .build();
    }

    @Override
    public A get() {
        return model;
    }

    @FunctionalInterface
    private interface Action {
        boolean execute(Throwable error);
    }

    @SuppressWarnings("unchecked")
    private A modelRetryWrap(A target, Class<A> interfaceType, int maxAttempt, Action onRetry) {
        return (A) Proxy.newProxyInstance(
                interfaceType.getClassLoader(),
                new Class<?>[]{interfaceType},
                (proxy, method, args) -> {
                    int attempts = 0;
                    while (attempts < maxAttempt) {
                        try {
                            return method.invoke(target, args);
                        } catch (InvocationTargetException e) {
                            attempts++;
                            Throwable cause = e.getCause();

                            if (attempts >= maxAttempt) {
                                throw cause;
                            }

                            if (cause != null && !onRetry.execute(cause)) {
                                throw cause;
                            }
                        }
                    }
                    throw new RuntimeException("Failed to invoke method " + method.getName() + " after " + maxAttempt + " attempts");
                }
        );
    }
}
