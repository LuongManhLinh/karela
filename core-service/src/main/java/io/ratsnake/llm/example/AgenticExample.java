package io.ratsnake.llm.example;

import dev.langchain4j.agentic.Agent;
import dev.langchain4j.agentic.AgenticServices;
import dev.langchain4j.agentic.declarative.Output;
import dev.langchain4j.agentic.declarative.ParallelAgent;
import dev.langchain4j.agentic.declarative.ParallelExecutor;
import dev.langchain4j.agentic.declarative.SubAgent;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

public class AgenticExample {
    public interface FoodExpert {

        @UserMessage("""
        You are a great evening planner.
        Propose a list of 3 meals matching the given mood.
        The mood is {{mood}}.
        For each meal, just give the name of the meal.
        Provide a list with the 3 items and nothing else.
        """)
        @Agent(outputName = "meals")
        List<String> findMeal(@V("mood") String mood);
    }

    public interface MovieExpert {

        @UserMessage("""
        You are a great evening planner.
        Propose a list of 3 movies matching the given mood.
        The mood is {{mood}}.
        Provide a list with the 3 items and nothing else.
        """)
        @Agent(outputName = "movies")
        List<String> findMovie(@V("mood") String mood);
    }

    public interface EveningPlannerAgent {

        @ParallelAgent(outputName = "plans", subAgents = {
                @SubAgent(type = FoodExpert.class, outputName = "meals"),
                @SubAgent(type = MovieExpert.class, outputName = "movies")
        })
        List<EveningPlan> plan(@V("mood") String mood);

        Executor executor = Executors.newFixedThreadPool(2);

        @ParallelExecutor
        static Executor executor() {
            return executor;
        }

        @Output
        static List<EveningPlan> createPlans(@V("movies") List<String> movies, @V("meals") List<String> meals) {
            List<EveningPlan> moviesAndMeals = new ArrayList<>();
            for (int i = 0; i < movies.size(); i++) {
                if (i >= meals.size()) {
                    break;
                }
                moviesAndMeals.add(new EveningPlan(movies.get(i), meals.get(i)));
            }
            return moviesAndMeals;
        }
    }

    public record EveningPlan(String movie, String meal) {
    }

    public static void main(String[] args) throws IOException {
        var apiKey = Files.readAllLines(Path.of("external/GEMINI_API_KEYS")).getFirst();
        var BASE_MODEL = GoogleAiGeminiChatModel.builder()
                .apiKey(apiKey)
                .modelName("gemini-2.0-flash-lite")
                .logRequestsAndResponses(true)
                .build();
//        FoodExpert foodExpert = AgenticServices
//                .agentBuilder(FoodExpert.class)
//                .chatModel(BASE_MODEL)
//                .async(true)
//                .outputName("meals")
//                .build();
//
//        MovieExpert movieExpert = AgenticServices
//                .agentBuilder(MovieExpert.class)
//                .chatModel(BASE_MODEL)
//                .async(true)
//                .outputName("movies")
//                .build();
//
//        var executor = Executors.newFixedThreadPool(2);
//
//        EveningPlannerAgent eveningPlannerAgent = AgenticServices
//                .parallelBuilder(EveningPlannerAgent.class)
//                .subAgents(foodExpert, movieExpert)
//                .executor(executor)
//                .outputName("plans")
//                .output(agenticScope -> {
//                    List<String> movies = agenticScope.readState("movies", List.of());
//                    List<String> meals = agenticScope.readState("meals", List.of());
//
//                    List<EveningPlan> moviesAndMeals = new ArrayList<>();
//                    for (int i = 0; i < movies.size(); i++) {
//                        if (i >= meals.size()) {
//                            break;
//                        }
//                        moviesAndMeals.add(new EveningPlan(movies.get(i), meals.get(i)));
//                    }
//                    return moviesAndMeals;
//                })
//                .build();

        EveningPlannerAgent eveningPlannerAgent = AgenticServices
                .createAgenticSystem(EveningPlannerAgent.class, BASE_MODEL);

        var plans = eveningPlannerAgent.plan("romantic");
        for (EveningPlan plan : plans) {
            System.out.println("Movie: " + plan.movie() + "---------- Meal: " + plan.meal());
        }
        System.out.println("Done.");
    }
}
