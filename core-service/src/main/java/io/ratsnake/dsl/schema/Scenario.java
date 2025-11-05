package io.ratsnake.dsl.schema;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
public class Scenario {
    private String title;
    private Step given;
    private Step when;
    private Step then;

    @Data
    @SuperBuilder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Step {
        private String text;

        @Builder.Default
        private List<NextStep> nextSteps = List.of();
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
    @JsonSubTypes({
            @JsonSubTypes.Type(value = NextStep.And.class, name = "And"),
            @JsonSubTypes.Type(value = NextStep.But.class, name = "But")
    })
    public static abstract class NextStep {
        private String text;

        @EqualsAndHashCode(callSuper = true)
        @AllArgsConstructor
        public static class And extends NextStep {
            public And(String text) {
                super(text);
            }
        }

        @EqualsAndHashCode(callSuper = true)
        @AllArgsConstructor
        public static class But extends NextStep {
            public But(String text) {
                super(text);
            }
        }

        public static And and(String text) {
            return new And(text);
        }

        public static But but(String text) {
            return new But(text);
        }
    }

    public static Step step(String text, NextStep... nextSteps) {
        return Step.builder().text(text).nextSteps(List.of(nextSteps)).build();
    }
}
