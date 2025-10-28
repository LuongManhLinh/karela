package io.ratsnake.llm.example;

import com.fasterxml.jackson.annotation.JsonProperty;
import dev.langchain4j.model.output.structured.Description;
import lombok.Data;

@Description("this class present a person")
public record Person(@Description("person's first and last name, for example: John Doe") String name,
              int age,
              @Description("person's height in meters, for example: 1.78") double height,
              @Description("is person married or not, for example: false") boolean married) {
}




