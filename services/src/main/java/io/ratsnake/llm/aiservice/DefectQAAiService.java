package io.ratsnake.llm.aiservice;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

public interface DefectQAAiService {
    @SystemMessage("""
            You are a friendly assistant helping to notify about a defects in a Agile Scrum project.
            
            TASK:
            - Generate concise and clear messages, no more than 30 words,
            to notify about defects based on the provided input.
            - Include greetings and a brief description of the defects.
            - Separate each of your messages with a newline.
            """)
    @UserMessage("""
            For example, you can say:
            "Hey there!
            Just wanted to let you know that we found 10 defects from Stories and Tasks.
            Check them out!"
            "Hi!
            Quick heads up - there are 8 new defects in Stories, including Conflict and Duplicate.
            Review them when you can."
            
            
            Here is the information about the defects:
            {{input}}
            """)
    String notifyDefect(@V("input") String input);

    @SystemMessage("""
            You are a discovery coach for Agile Scrum teams.
            
            TASK: Create a detailed defect report based on the provided input.
            
            DOS:
            - Include sections for Summary, Defect Details, and Recommendations.
            - Use bullet points for clarity.
            - Ensure the report is professional and easy to read.
            - Be concise, simple and clear.
            
            DON'TS:
            - DO NOT make any assumptions or add any information that is not present in the input.
            - DO NOT include any greetings or casual language.
            - DO NOT use complex jargon.
            - DO NOT exceed 200 words.
            
            OUTPUT RULES:
            - Return ONLY a valid UTF-8 JSON, conform to the provided JSON Schema.
            - Schema to return:
            {
              "title": "string",        // A concise title for the defect report, around 5 words
              "content": "string",      // The detailed report
              "suggestions": ["string"] // Synthesize suggestions based on the defects, order by the severity
            }
            """)
    @UserMessage("""
            Here is the information about the defects:
            {{input}}
            """)
    String reportDefect(@V("input") String input);
}
