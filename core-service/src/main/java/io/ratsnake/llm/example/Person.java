package io.ratsnake.llm.example;

import com.fasterxml.jackson.annotation.JsonProperty;
import dev.langchain4j.model.output.structured.Description;
import lombok.Data;

@Description("this class present a person")
public record Person(@Description("person's first and last name, for example: John Doe") String pName,
              int pAge,
              @Description("person's height in meters, for example: 1.78") double pHeight,
              @Description("the email of the person") String pEmail){
}




