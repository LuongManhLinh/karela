package io.ratsnake.llm.adapter;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.ratsnake.llm.models.DynamicModel;
import lombok.AllArgsConstructor;

import static io.ratsnake.util.LanguageProcessor.jsonify;
import static io.ratsnake.util.LanguageProcessor.secureParseJson;

@AllArgsConstructor
public class AiAdapter<AS> {
    private static final int DEFAULT_MAX_RETRIES = 3;
    private final DynamicModel<AS> model;
    private final int maxRetries;

    public AiAdapter(DynamicModel<AS> model) {
        this(model, DEFAULT_MAX_RETRIES);
    }

    @FunctionalInterface
    protected interface AIAction {
        String generate(String input) throws Exception;
    }

    protected <I, O> O executeWithRetries(I input, Class<O> outputClass, AIAction action, String actionName) {
        int attempts = 0;
        while (attempts < maxRetries) {
            try {
                String inputJson = jsonify(input);
                String outputJson = action.generate(inputJson);
                System.out.println("========= " + actionName + " =========");
                System.out.println("Input JSON: " + inputJson);
                System.out.println("Output JSON: " + outputJson);
                System.out.println("===================================");
                return secureParseJson(outputJson, outputClass);
            } catch (Exception e) {
                attempts++;
                System.err.println("Attempt " + attempts + " failed for action " + actionName + ": " + e.getMessage());
                model.roll();
                if (attempts >= maxRetries) {
                    throw new RuntimeException("Failed to " + actionName + " after " + maxRetries + " attempts", e);
                }
            }
        }
        throw new RuntimeException("Unexpected error in " + actionName);
    }

    protected String executeWithRetries(String input, AIAction action, String actionName) {
        int attempts = 0;
        while (attempts < maxRetries) {
            try {
                return action.generate(input);
            } catch (Exception e) {
                attempts++;
                model.roll();
                if (attempts >= maxRetries) {
                    throw new RuntimeException("Failed to " + actionName + " after " + maxRetries + " attempts", e);
                }
            }
        }
        throw new RuntimeException("Unexpected error in " + actionName);
    }

    public AS model() {
        return model.get();
    }

    public static void main(String[] args) throws JsonProcessingException {
        String s = "hello";
        System.out.println(secureParseJson(s, String.class));
    }
}
