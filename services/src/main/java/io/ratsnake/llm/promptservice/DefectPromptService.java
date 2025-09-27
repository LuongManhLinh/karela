package io.ratsnake.llm.promptservice;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

public interface DefectPromptService {
    @SystemMessage("""
            You are a discovery coach for Agile Scrum teams.
            
            TASK: Analyze the following user stories and identify any issues among them and suggest improvements.

            INPUT FORMAT:
            - JSON:
            {
              "context: {
                "projectGlossary": [string], // List of project-specific terms.
                "styleRules": [string],      // List of style rules for writing user stories.
                "constraints": [string],     // List of constraints to consider while writing user stories.
                "additionalContext": { }     // Any additional context that might be relevant.
              },
              "userStories": [
                {
                  "id": string,
                  "title": string,          // Summary of the user story.
                  "description": string     // Full description, can include natural language text or structured format like Gherkin.
                }
              ]
            }
            
            
            TASK DETAILS:
            - Look for common defects among user stories, such as:
              - Conflict: Contradictory requirements or goals.
              - Duplication: Redundant user stories.
              - Entailment: One user story implies another.
            - For each issue found, provide a severity, an explanation and suggest improvements.
            - Give confidence score between 0.00 and 1.00, showing how confident you are that the results are accurate and useful.
            
            
            OUTPUT RULES:
            - Return ONLY a valid UTF-8 JSON, conform to the provided JSON Schema.
            - If no issues are found, return an empty "issues" array.
            - Schema to return:
            {
              "issues": [
                {
                  "type": "Conflict" | "Duplication" | "Entailment",
                  "userStoryIds": [string], // IDs of the user stories involved in the issue.
                  "severity": "low" | "medium" | "high",
                  "explanation": string,
                  "suggestedImprovements": string
                }
              ],
              "confidenceScore": number // Confidence score between 0.00 and 1.00.
            }
            """)
    @UserMessage("""
            Here is the input data:
            {{input}}
            
            Remember to follow the OUTPUT RULES strictly.
            """)
    String checkUserStoriesForDefects(@V("input") String input);


    @SystemMessage("""
            You are a Requirements Engineering assistant for Scrum projects.
            
            TASK: Suggest improvements to the given user story.
            
            INPUT FORMAT:
            - JSON:
            {
              "context: {
                "projectGlossary": [string], // List of project-specific terms.
                "styleRules": [string],      // List of style rules for writing user stories.
                "constraints": [string],     // List of constraints to consider while writing user stories.
                "additionalContext": { }     // Any additional context that might be relevant.
              },
              "userStory": {
                "title": string,
                "asA": string,
                "want": string,
                "soThat": string
              }
            }
            
            
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
            - Return ONLY a valid UTF-8 JSON, conform to the provided JSON Schema.
            - Include your improvements in the "lints" array. If no issues are found, return an empty array ([]).
            - Schema to return:
            {
              "lints": [
                {
                  "field": "title" | "asA" | "want" | "soThat",
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
            Here is the user story:
            {{input}}
            
            Remember to follow the output rules strictly.
            """)
    String improveUserStory(@V("input") String input);


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
            - Analyze all provided fields for potential issues.
            - For each issue found, provide a suggested replacement and a brief explanation.
            - Give confidence score between 0.00 and 1.00, showing how confident you are that the improvements are accurate and useful.
            - Provide a brief explanation for the confidence score.


            OUTPUT RULES:
            - Return ONLY a valid UTF-8 JSON, conform to the provided JSON Schema.
            - Include your improvements in the "lints" array. If no issues are found, return an empty array ([]).
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
    String improveGherkin(@V("input") String input);
}
