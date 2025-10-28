package io.ratsnake.llm.aiservice;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
import io.ratsnake.llm.dto.out.DetectDefectOutput;
import io.ratsnake.llm.dto.out.ImproveItemOutput;

public interface DefectAiService {
    @SystemMessage("""
            You are a discovery coach for Agile Scrum teams.
            
            TASK: Analyze the following work items of the same type, identify any defects among them and suggest improvements.
            
            TASK DETAILS:
            - Look for common defects:
              - CONFLICT: Contradictory requirements or goals.
              - DUPLICATION: Redundant or overlapping requirements.
              - ENTAILMENT: One item implies another, making it unnecessary.
            - For each issue found, provide a severity, an explanation and suggest improvements.
            - Give confidence score between 0.00 and 1.00, showing how confident you are that the results are accurate and useful.
            """)
    @UserMessage("""
            Here is the input data:
            {{input}}
            """)
    DetectDefectOutput checkWorkItemsSingleType(@V("input") String input);

    @SystemMessage("""
            You are a discovery coach for Agile Scrum teams.
            
            TASK: Analyze the following work items, identify any defects at each item level and suggest improvements.
            
            TASK DETAILS:
            - Analyze each work item independently.
            - Evaluate each item in isolation vs the context to find OUT_OF_SCOPE, IRRELEVANCE, INCOMPLETENESS and AMBIGUITY.
            - For each issue found, provide a severity, an explanation and suggest improvements.
            - Give confidence score between 0.00 and 1.00, showing how confident you are that the results are accurate and useful.
            
            OUTPUT RULES:
            - If no defects are found, return an empty "defects" array.
            """)
    @UserMessage("""
            Here is the input data:
            {{input}}
            """)
    DetectDefectOutput checkSingleWorkItem(@V("input") String input);


    @SystemMessage("""
            You are a discovery coach for Agile Scrum teams.
            
            TASK: Analyze the following work items, identify any defects among them and suggest improvements.

            TASK DETAILS:
            - Analyze work items that are related to each other (check "relatedItemIds" field).
            - Compare items against same-type peers plus related items across types to find INCONSISTENCY and even CONFLICT.
            - For each issue found, provide a severity, an explanation and suggest improvements.
            - Give confidence score between 0.00 and 1.00, showing how confident you are that the results are accurate and useful.
            
            OUTPUT RULES:
            - If no defects are found, return an empty "defects" array.
            """)
    @UserMessage("""
            Here is the input data:
            {{input}}
            """)
    DetectDefectOutput checkWorkItemsCrossTypes(@V("input") String input);


    @SystemMessage("""
            You are a Requirements Engineering assistant for Scrum projects.
            
            TASK: Suggest improvements to the given user story.

            TASK DETAILS:
            - Analyze each user story for:
              - Clarity: Is the user story clear and understandable?
              - Completeness: Does it include all necessary components?
              - Consistency: Are the user stories consistent with the project glossary and style rules?
              - Relevance: Are the user stories relevant to the project's goals and constraints?
            - For each issue found, provide a suggested replacement and a brief explanation.
            - Fix suggestion rules:
                - missing part: provide a suitable suggestion.
                - vague wording: provide a measurable and suitable alternative (e.g., replace "quickly" with "within 2 seconds").
                - grammar or spelling mistake: provide the corrected version.
                - inconsistency with style rules or project glossary: provide a compliant alternative.
            - Give confidence score between 0.00 and 1.00, showing how confident you are that the lints are accurate and useful.
            - Provide a brief explanation for the confidence score.
            
            OUTPUT RULES:
            - If no defects are found, return an empty "defects" array.
            """)
    @UserMessage("""
            Here is the user story:
            {{input}}
            """)
    ImproveItemOutput improveStructuredUserStory(@V("input") String input);


    @SystemMessage("""
            You are a Requirements Engineering assistant for Scrum projects.
            
            TASK: Suggest improvements to the given Gherkin acceptance criteria.
            
            
            SCHEMAS USED IN INPUT:
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
              }
              "gherkin": Gherkin // The gherkin acceptance criteria being written
            }
            
            
            TASK DETAILS:
            - Suggest ONLY improvements on the gherkin provided.
            - Analyze all provided fields for potential defects.
            - For each issue found, provide a suggested replacement and a brief explanation.
            - Give confidence score between 0.00 and 1.00, showing how confident you are that the improvements are accurate and useful.
            - Provide a brief explanation for the confidence score.


            OUTPUT RULES:
            - Return ONLY a valid UTF-8 JSON, conform to the provided JSON Schema.
            - Include your improvements in the "lints" array. If no defects are found, return an empty array ([]).
            - To define "field" in the lints, use this rule:
                - Use "." to indicate hierarchy
                - Use "[index]" to indicate list index (0-based)
                - For examples:
                  - "feature.title"
                  - "scenarios[1].then.nextSteps[0].text"
            - Schema to return:
            {
              "lints": [
                {
                  "field": string,
                  "issue": string,
                  "suggestedReplacement": string
                  "message": string
                }
              ],
              "confidence": number,
              "explanation": string
            }
            """)
    @UserMessage("""
            Here is the input:
            {{input}}
            
            Remember to follow the output rules strictly.
            """)
    ImproveItemOutput improveStructuredGherkin(@V("input") String input);
}
