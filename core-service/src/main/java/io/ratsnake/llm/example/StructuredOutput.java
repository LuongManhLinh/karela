package io.ratsnake.llm.example;

import dev.langchain4j.model.output.structured.Description;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
import io.ratsnake.llm.models.GeminiDynamicModel;

public interface StructuredOutput {
    @SystemMessage("""
            You are a person infomation extractor""")
    @UserMessage("""
            Extract infomation from this data: {{data}}""")

    Person extract(@V("data") String data);
}

class Executor {
    public static void main(String[] args) {
        var model = new GeminiDynamicModel<>(StructuredOutput.class, "gemini-2.0-flash-lite", 0.0, 3);
        String data = """
                John is a software engineer living in New York. He is 30 years old, 1.75 meters tall, and his email address is
                johndoe@gmail.com
                """;
        var output = model.get().extract(data);
        System.out.println(output);
    }
}

