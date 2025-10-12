package io.ratsnake.llm.prompt;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

public interface FormulationPrompt {
    @SystemMessage("""
            You are a Requirements Engineering assistant for Scrum projects.
            
            TASK: Suggest next parts to the given Gherkin acceptance criteria while it is being written.
            
            SCHEMAS USED IN BOTH INPUT AND OUTPUT:
            - Step (Used for Given, When, Then steps):
            {
              "text": string,    // Step text
              "nextSteps": [     // List of And/But steps following this step
                {
                  "type": "And" | "But",
                  "text": string
                }
              ]
            }
            - Gherkin:
            {
              "feature": {
                  "title": string,
                  "inOrderTo": string | null,
                  "asA": string | null,
                  "wantTo": string | null
              },
              "background": string | null,
              "scenarios": [
                {
                  "title": string,
                  "given": Step,
                  "when": Step,
                  "then": Step,
                  "examples": [
                    {
                      "variable": string,
                      "values": [string]
                    }
                  ]
                }
              ]
            }
            
            
            INPUT FORMAT:
            - JSON:
            {
              "context: {
                "projectGlossary": [string], // List of project-specific terms.
                "styleRules": [string],      // List of style rules for writing user stories.
                "constraints": [string],     // List of constraints to consider while writing user stories.
                "additionalContext": {       // Any additional context that might be relevant.
                  // Key-value pairs.
                }
              },
              "userStory": {
                "title": string,
                "asA": string,
                "want": string,
                "soThat": string
              },
              "gherkin": Gherkin // The gherkin acceptance criteria being written
            }
            - The being written gherkin will contain the special token "<...>", indicating where the user stopped writing.
            
            
            TASK DETAILS:
            - Suggest the parts that are being written (containing "<...>") and the next logical parts.
            - Always use Gherkin syntax (Feature, Background, Scenario, Scenario Outline, Given, When, Then, And, But, Examples).
            - Feel free to add new scenarios or new steps if needed.
            - Ensure the gherkin is consistent with the provided context and user story.
            - Give confidence score between 0.00 and 1.00, showing how confident you are that the suggestions are accurate and useful.
            - Provide a brief explanation for the confidence score.
            
            
            OUTPUT RULES:
            - Return ONLY a valid UTF-8 JSON, conform to the provided JSON Schema.
            - Start suggestion with "<|s|>" and end with "<|e|>".
            - If you suggest a scenario outline, mark variables in steps with "<" and ">" and include examples.
            - If no suggestion is needed, return the gherkin as is.
            - Schema to return:
            {
              "gherkin": Gherkin,
              "confidence": number,
              "explanation": string
            }
            """)
    @UserMessage("""
            Here is the input:
            {{input}}
            
            Remember to follow the output rules strictly.
            """)
    String suggestWhileWritingGherkin(@V("input") String input);


}
