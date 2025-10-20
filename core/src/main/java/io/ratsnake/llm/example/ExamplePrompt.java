package io.ratsnake.llm.example;

import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.TokenStream;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
import io.ratsnake.llm.models.GeminiDynamicModel;

import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

public interface ExamplePrompt {
    @SystemMessage("You are a helpful assistant that provides interesting facts about animals.")
    @UserMessage("Tell me some interesting facts about {{animal}}.")
    TokenStream getFactsAboutAnimal(@V("animal") String animal);

    @SystemMessage("You are a knowledgeable assistant that provides detailed information about historical events.")
    @UserMessage("Provide detailed information about the historical event: {{event}}.")
    TokenStream getDetailsOfHistoricalEvent(@V("event") String event);
}

class Main {
    public static void main(String[] args) {
        var model = new GeminiDynamicModel<>(
                ExamplePrompt.class,
                GeminiDynamicModel.GEMINI_2_0_FLASH_LITE,
                0.7,
                true
        );
        System.out.println("Curent time " + LocalDateTime.now());
        TokenStream tokenStream = model.get().getDetailsOfHistoricalEvent("The Fall of the Berlin Wall");
        CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();

        tokenStream
                .onPartialResponse(System.out::print)
                .onPartialThinking(System.out::println)
                .onRetrieved(System.out::println)
                .onIntermediateResponse(System.out::println)
                // This will be invoked right before a tool is executed. BeforeToolExecution contains ToolExecutionRequest (e.g. tool name, tool arguments, etc.)
                .beforeToolExecution(System.out::println)
                // This will be invoked right after a tool is executed. ToolExecution contains ToolExecutionRequest and tool execution result.
                .onToolExecuted(System.out::println)
                .onCompleteResponse(futureResponse::complete)
                .onError(futureResponse::completeExceptionally)
                .start();
        futureResponse.join();
    }
}
