package io.ratsnake.llm.example;

import dev.langchain4j.model.output.structured.Description;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
import io.ratsnake.llm.models.GeminiDynamicModel;

import java.util.List;

public interface PersonService {
    @SystemMessage("""
            You are an expert at extracting structured data from unstructured text.
            Extract the person's information from the given text and return it as a Person object.
            """)
    @UserMessage("""
            Extract the person's information from the following text:
            {{text}}
            """)
    Person extractPerson(@V("text") String text);
}


class Main {
    public static void main(String[] args) {
        String text = """
                Oh my god, do you know about the story of Reli.
                Last year, she married a good man, but now the man got so bad and they divorced.
                Can't believe that a beautiful girl like her got betrayed eventually.
                She is the tallest girl in this street, do you know how tall she is? 1.85 meters
                """;
        var model = new GeminiDynamicModel<PersonService>(PersonService.class,
                GeminiDynamicModel.GEMINI_2_0_FLASH_LITE,
                0.0,
                3);
        System.out.println(model.get().extractPerson(text));
//        System.out.println(model.get().extractStudent(text));
//        var req = "Extract the person's information from the following text:\nJohn is 42 years old and lives an independent life.\nHe stands 1.75 meters tall and carries himself with confidence.\nCurrently unmarried, he enjoys the freedom to focus on his personal goals and interests.\n\n\nYou must answer strictly in the following JSON format: {\n\"name\": (person's first and last name, for example: John Doe; type: string),\n\"age\": (person's age, for example: 42; type: integer),\n\"height\": (person's height in meters, for example: 1.78; type: double),\n\"married\": (is person married or not, for example: false; type: boolean)\n}";
//        var res = "```json\n{\n\"name\": \"John\",\n\"age\": 42,\n\"height\": 1.75,\n\"married\": false\n}\n```";
//        System.out.println(req);
//        System.out.println();
//        System.out.println(res);

    }
}
