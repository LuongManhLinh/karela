package io.ratsnake.llm.example;

import dev.langchain4j.model.output.structured.Description;

@Description("a person")
public record Person(@Description("person's first and last name, for example: John Doe") String name,
              @Description("person's age, for example: 42") int age,
              @Description("person's height in meters, for example: 1.78") double height,
              @Description("is person married or not, for example: false") boolean married) {
}
