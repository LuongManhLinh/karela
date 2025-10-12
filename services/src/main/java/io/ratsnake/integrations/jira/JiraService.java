package io.ratsnake.integrations.jira;

import io.ratsnake.integrations.jira.dto.Issue;
import io.ratsnake.integrations.jira.dto.IssueType;
import io.ratsnake.integrations.jira.dto.IssuesCreateRequest;
import io.ratsnake.integrations.jira.dto.Project;
import io.ratsnake.integrations.jira.jql.Expand;
import io.ratsnake.integrations.jira.jql.Field;
import io.ratsnake.integrations.jira.llm.IssuesGenerateAIService;
import io.ratsnake.integrations.jira.dto.IssuesGenerateInput;
import io.ratsnake.integrations.jira.llm.IssuesGeneratePrompt;
import io.ratsnake.integrations.jira.dto.LlmProcessedIssue;
import io.ratsnake.llm.models.GeminiDynamicModel;
import io.ratsnake.util.AdfProcessor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.io.IOException;
import java.util.List;

import static io.ratsnake.util.LanguageProcessor.jsonify;

@AllArgsConstructor
@Builder
public class JiraService {
    private final JiraApi api;
    private final IssuesGenerateAIService issuesGenerateAIService;

    public JiraService() {
        this.api = JiraApiFactory.create();
        this.issuesGenerateAIService = new IssuesGenerateAIService(
                new GeminiDynamicModel<>(
                        IssuesGeneratePrompt.class,
                        GeminiDynamicModel.GEMINI_2_0_FLASH,
                        0.7
                )
        );
    }


    public List<Issue> searchIssues(
            String jql,
            List<Field> fields,
            int maxResults,
            boolean expandRenderedFields
    ) throws IOException {
        String fieldsParam = fields.stream()
                .map(Field::text)
                .reduce((a, b) -> a + "," + b)
                .orElse("");
        String expandParam = expandRenderedFields ? Expand.RENDERED_FIELDS.text() : "";
        var call = api.searchIssues(
                jql,
                fieldsParam,
                maxResults,
                expandParam
        ).execute();

        if (!call.isSuccessful()) {
            try (var errorBody = call.errorBody()) {
                var errorMessage = errorBody != null ? errorBody.string() : "Unknown error";
                System.err.println("Error: " + call.code() + " - " + call.message() + "\n" + errorMessage);
                return List.of();
            }
        }

        var body = call.body();
        if (body == null) {
            System.err.println("Failed to fetch issues from Jira.");
            return List.of();
        }

        return body.getIssues();
    }


    public void generateIssuesUsingLLM(
            String projectKey,
            int numberOfIssuesToGenerate,
            String projectDescription,
            List<String> glossary,
            List<String> constraints,
            List<LlmProcessedIssue> existingIssues,
            boolean requireStructuredIssues
    ) throws IOException {
        System.out.println("Generating " + numberOfIssuesToGenerate + " issues for project " + projectKey);
        var generateIssues = issuesGenerateAIService.generateIssues(
                IssuesGenerateInput.builder()
                        .numberOfIssuesToGenerate(numberOfIssuesToGenerate)
                        .projectDescription(projectDescription)
                        .glossary(glossary)
                        .constraints(constraints)
                        .existingIssues(existingIssues)
                        .build(),
                requireStructuredIssues
        ).getIssues();

        System.out.println("Generated " + generateIssues.size() + " issues, creating in Jira...");
        var call = api.createIssues(
                IssuesCreateRequest.builder()
                        .issueUpdates(generateIssues.stream().map(issue ->
                                IssuesCreateRequest.IssueUpdate.builder()
                                        .fields(IssuesCreateRequest.Fields.builder()
                                                .project(new Project(projectKey))
                                                .summary(issue.getSummary())
                                                .issuetype(new IssueType(issue.getIssueType()))
                                                .description(AdfProcessor.parseMarkdown(issue.getDescription()).toMap())
                                                .build())
                                        .build()
                        ).toList())
                        .build()
        ).execute();

        if (!call.isSuccessful()) {
            try (var errorBody = call.errorBody()) {
                var errorMessage = errorBody != null ? errorBody.string() : "Unknown error";
                System.err.println("Error: " + call.code() + " - " + call.message() + "-" + errorMessage);
            }
        }

        var body = call.body();
        if (body == null) {
            System.out.println("No response received.");
            return;
        }

        System.out.println("Done! Response:");
        System.out.println(jsonify(body));
    }

}
