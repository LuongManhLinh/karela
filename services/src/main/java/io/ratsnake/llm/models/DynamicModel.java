package io.ratsnake.llm.models;

/**
 * Interface for dynamic models that can roll through different configurations or states.
 *
 * @param <T> The type of the model being managed.
 */
public interface DynamicModel<T> {
    void roll();
    T get();
}
