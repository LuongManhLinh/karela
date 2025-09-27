package io.ratsnake.llm.aiservice;

import io.ratsnake.llm.models.DynamicModel;
import lombok.AllArgsConstructor;

@AllArgsConstructor
public class AIService<P> {
    private static final int DEFAULT_MAX_RETRIES = 3;
    private final DynamicModel<P> model;
    private final int maxRetries;

    public AIService(DynamicModel<P> model) {
        this(model, DEFAULT_MAX_RETRIES);
    }

    @FunctionalInterface
    protected interface AIAction<T> {
        T execute() throws Exception;
    }

    protected <T> T executeWithRetries(AIAction<T> action, String actionName) {
        int attempts = 0;
        while (attempts < maxRetries) {
            try {
                return action.execute();
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

    public P model() {
        return model.get();
    }
}
