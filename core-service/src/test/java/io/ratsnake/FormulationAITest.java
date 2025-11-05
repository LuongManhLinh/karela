package io.ratsnake;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.ratsnake.dsl.schema.*;
import io.ratsnake.llm.adapter.DefectAiAdapter;
import io.ratsnake.llm.adapter.FormulationAiAdapter;
import io.ratsnake.llm.dto.ContextInput;
import io.ratsnake.llm.dto.in.GenerateGherkinInput;
import io.ratsnake.llm.dto.in.GenerateUserStoryInput;
import io.ratsnake.llm.dto.UserStoryDto;
import io.ratsnake.llm.models.GeminiDynamicModel;
import io.ratsnake.llm.aiservice.DefectAiService;
import io.ratsnake.llm.aiservice.FormulationAiService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static io.ratsnake.util.LanguageProcessor.jsonify;

public class FormulationAITest {
    private final FormulationAiAdapter formulationAIService = new FormulationAiAdapter(
            new GeminiDynamicModel<>(
                    FormulationAiService.class,
                    GeminiDynamicModel.GEMINI_2_0_FLASH,
                    0.4,
                    3
            )
    );

    private final DefectAiAdapter defectAIService = new DefectAiAdapter(
            new GeminiDynamicModel<>(
                    DefectAiService.class,
                    GeminiDynamicModel.GEMINI_2_0_FLASH,
                    0.4,
                    3
            )
    );


    @Test
    void improveUserStoryTest() throws JsonProcessingException {
        long startTime = System.currentTimeMillis();
        var input = GenerateUserStoryInput.builder()
                .context(
                        ContextInput.builder()
                                .projectGlossary(List.of("traveler", "PNR", "fare class"))
                                .styleRules(List.of("avoid vague words like 'quickly' or 'best'", "actor and benefit must be explicit"))
                                .constraints(List.of())
                                .additionalContext(Map.of())
                                .build()
                )
                .userStory(
                        UserStoryDto.builder()
                                .title("Search for flights")
                                .role("traveler")
                                .feature("search for flights quickly and easily by entering origin, destination, and dates")
                                .benefit("find the best flight options that suit my needs")
                                .build()
                )
                .build();

        var output = defectAIService.improveStructuredUserStory(input);
        long endTime = System.currentTimeMillis();
        System.out.println("Time taken: " + (endTime - startTime) + " ms. Output:");
        System.out.println(jsonify(output));
    }

    @Test
    void generateGherkinTest() throws JsonProcessingException {
        long startTime = System.currentTimeMillis();
        var input = GenerateGherkinInput.builder()
                .context(
                        ContextInput.builder()
                                .projectGlossary(List.of("traveler", "PNR", "fare class"))
                                .styleRules(List.of("avoid vague words like 'quickly' or 'best'", "actor and benefit must be explicit"))
                                .constraints(List.of())
                                .additionalContext(Map.of())
                                .build()
                )
                .userStory(
                        UserStoryDto.builder()
                                .title("Search for flights")
                                .role("traveler")
                                .feature("search for flights by entering origin, destination, and dates with response time under 2 seconds")
                                .benefit("find the flight options that suit my needs")
                                .build()
                )
                .gherkin(
                        Gherkin.builder()
                                .feature(
                                        Feature.builder()
                                                .asA("traveler")
                                                .inOrderTo("search for flights quickly and easily by entering origin, destination, and dates")
                                                .wantTo(" to find the best flight options that suit my needs")
                                                .build()
                                )
                                .scenarios(List.of(
                                        Scenario.builder()
                                                .title("Successful flight search")
                                                .given(
                                                        Scenario.Step.builder().text("the traveler is on the<...>").build()
                                                )
                                                .build()
                                ))
                                .build()
                )
                .build();

        var output = formulationAIService.suggestWhileWritingGherkin(input);
        long endTime = System.currentTimeMillis();
        System.out.println("Time taken: " + (endTime - startTime) + " ms. Output:");
        System.out.println(jsonify(output));
    }

    @Test
    void improveGherkinTest() throws JsonProcessingException {
        long startTime = System.currentTimeMillis();
        var input = GenerateGherkinInput.builder()
                .context(
                        ContextInput.builder()
                                .projectGlossary(List.of("traveler", "PNR", "fare class"))
                                .styleRules(List.of("avoid vague words like 'quickly' or 'best'", "actor and benefit must be explicit"))
                                .constraints(List.of())
                                .additionalContext(Map.of())
                                .build()
                )
                .userStory(
                        UserStoryDto.builder()
                                .title("Search for flights")
                                .role("traveler")
                                .feature("search for flights by entering origin, destination, and dates with response time under 2 seconds")
                                .benefit("find the flight options that suit my needs")
                                .build()
                )
                .gherkin(
                        Gherkin.builder()
                                .feature(
                                        Feature.builder()
                                                .asA("account holder")
                                                .inOrderTo("get money when the bank is closed")
                                                .wantTo("withdraw cash from an ATM")
                                                .build()
                                )
                                .scenarios(List.of(
                                        ScenarioOutline.builder()
                                                .title("Account has sufficient funds")
                                                .given(
                                                        Scenario.step(
                                                                "the account balance is <balance>",
                                                                    Scenario.NextStep.and("the machine contains enough money"),
                                                                    Scenario.NextStep.and("we introduce a <card type>")
                                                        )
                                                )
                                                .when(
                                                        Scenario.Step.builder()
                                                                .text("we request <amount>")
                                                                .build()
                                                )
                                                .then(
                                                        Scenario.step(
                                                                "the ATM should dispense the cash",
                                                                Scenario.NextStep.and("the card is returned"),
                                                                Scenario.NextStep.and("the account balance is <new balance>")
                                                        )
                                                )
                                                .examples(List.of(
                                                        Example.builder()
                                                                .variable("card type")
                                                                .values(List.of("Visa", "AMEX", "MasterCard"))
                                                                .build(),
                                                        Example.builder()
                                                                .variable("amount")
                                                                .values(List.of("20", "50", "80"))
                                                                .build(),
                                                        Example.builder()
                                                                .variable("new balance")
                                                                .values(List.of("80", "50", "20"))
                                                                .build()
                                                ))
                                                .build(),
                                        Scenario.builder()
                                                .title("Account has insufficient funds")
                                                .given(
                                                        Scenario.step("the account balance is 10")
                                                )
                                                .when(
                                                        Scenario.step("we request 20")
                                                )
                                                .then(
                                                        Scenario.step(
                                                                "the ATM should not dispense any cash",
                                                                Scenario.NextStep.and("the account balance is 10"),
                                                                Scenario.NextStep.and("the card is returned")
                                                        )
                                                )
                                                .build()
                                ))
                                .build()
                )
                .build();

        var output = defectAIService.improveStructuredGherkin(input);
        long endTime = System.currentTimeMillis();
        System.out.println("Time taken: " + (endTime - startTime) + " ms. Output:");
        System.out.println(jsonify(output));
    }
}
