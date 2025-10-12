package io.ratsnake;

import com.atlassian.adf.model.node.Doc;
import io.ratsnake.integrations.jira.JiraApi;
import io.ratsnake.integrations.jira.JiraApiFactory;
import io.ratsnake.integrations.jira.JiraService;
import io.ratsnake.integrations.jira.dto.IssuesCreateRequest;
import io.ratsnake.integrations.jira.dto.Project;
import io.ratsnake.integrations.jira.dto.SearchRequest;
import io.ratsnake.integrations.jira.jql.Field;
import io.ratsnake.integrations.jira.jql.IssueType;
import io.ratsnake.integrations.jira.jql.Jql;
import io.ratsnake.integrations.jira.jql.Order;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static io.ratsnake.util.LanguageProcessor.jsonify;

public class JiraApiTest {
    private final JiraApi api = JiraApiFactory.create();
    private final JiraService service = new JiraService();

    @Test
    void testGetAllIssues() throws IOException {
        var response = api.searchIssues(
                SearchRequest.builder()
                        .jql(Jql.builder()
                                .project("RD")
                                .and()
                                .issuetypeIn(IssueType.STORY, IssueType.TASK)
                                .orderBy(
                                        Field.CREATED,
                                        Order.DESC
                                )
                                .build()
                        )
                        .fields(List.of("summary", "status", "priority", "description", "issuetype"))
                        .maxResults(20)
                        .expand("renderedFields")
                        .build()
        ).execute().body();

        if (response == null) {
            System.out.println("No response received.");
            return;
        }

        System.out.println("Total issues: " + response.getTotal());
        response.getIssues().forEach(issue -> {
            System.out.println("Issue Key: " + issue.getKey());
            System.out.println("Summary: " + issue.getFields().getSummary());
            System.out.println("Status: " + issue.getFields().getStatus().getName());
            System.out.println("Priority: " + issue.getFields().getPriority().getName());
            System.out.println("Issue Type: " + issue.getFields().getIssuetype().getName());
            System.out.println("Description: " + issue.getFields().getDescription());
            System.out.println("Rendered Description: " +
                    (issue.getRenderedFields() != null ? issue.getRenderedFields().getDescription() : "N/A"));
            System.out.println("-----");
        });
    }

    @Test
    void testCreateIssues() throws IOException {
        String text = "This is a test issue created via the Jira API.";
        Map<String, Object> textNode = new HashMap<>();
        textNode.put("type", "text");
        textNode.put("text", text);

        Map<String, Object> para = new HashMap<>();
        para.put("type", "paragraph");
        para.put("content", List.of(textNode));

        Map<String, Object> doc = new HashMap<>();
        doc.put("type", "doc");
        doc.put("version", 1);
        doc.put("content", List.of(para));

        var req = IssuesCreateRequest.builder()
                .issueUpdates(List.of(
                        IssuesCreateRequest.IssueUpdate.builder()
                                .fields(
                                        IssuesCreateRequest.Fields.builder()
                                                .project(
                                                        Project.builder()
                                                                .key("RD")
                                                                .build()
                                                )
                                                .summary("Test issue from API 11")
                                                .issuetype(
                                                        io.ratsnake.integrations.jira.dto.IssueType.builder()
                                                                .name("Task")
                                                                .build()
                                                )
                                                .description(
                                                        Doc.parse(doc).toMap()
                                                )
                                                .build()
                                )
                                .build()
                ))
                .build();
        System.out.println(jsonify(req));
        var call = api.createIssues(
            req
        ).execute();


        if (!call.isSuccessful()) {
            String err = call.errorBody() != null ? call.errorBody().string() : "Unknown error";

            throw new IOException(
                    "Failed to create issue: " + call.code() + " - " + call.message() + " - " + err
            );
        }

        var response = call.body();

        if (response == null) {
            System.out.println("No response received.");
            return;
        }

        System.out.println("Created Issue ID: " + response.getId());
        System.out.println("Created Issue Key: " + response.getKey());
        System.out.println("Created Issue Self URL: " + response.getSelf());
    }

    @Test
    void testJiraServiceGenerateIssues_5() throws IOException {
        long start = System.currentTimeMillis();
        System.out.println("Starting issue generation...");
        service.generateIssuesUsingLLM(
                "RD",
                5,
                "Ratsnake is an AI-powered tool that helps developers write, understand, and refactor code faster. It integrates with popular IDEs and supports multiple programming languages.",
                List.of("Ratsnake", "AI", "IDE", "code", "developers"),
                List.of("Use simple language", "Be concise"),
                List.of(),
                false
        );
        long end = System.currentTimeMillis();
        System.out.println("Issue generation completed in " + (end - start) + " ms.");
    }

    @Test
    void testJiraServiceGenerateIssues_40_natural() throws IOException {
        long start = System.currentTimeMillis();
        System.out.println("Starting issue generation...");
        // AF is an flight booking project
        service.generateIssuesUsingLLM(
                "SAF",
                40,
                """
                        AirlineFlight is a comprehensive flight booking platform that allows users to search, book,
                        and manage their flights with ease.
                        The platform offers a user-friendly interface,
                        secure payment options, and real-time flight updates to enhance the travel experience.
                        It also provides features like seat selection, baggage management,
                        and customer support to ensure a seamless journey for travelers.
                        """,
                List.of("flight booking", "travel", "user-friendly", "secure payment", "real-time updates"),
                List.of("Use simple language", "Be concise", "70% Stories, 25% Tasks, 5% Bugs"),
                List.of(),
                false
        );
        long end = System.currentTimeMillis();
        System.out.println("Issue generation completed in " + (end - start) + " ms.");
    }

    @Test
    void testJiraServiceGenerateIssues_40_structured() throws IOException {
        long start = System.currentTimeMillis();
        System.out.println("Starting issue generation...");
        // AF is an flight booking project
        service.generateIssuesUsingLLM(
                "SAF",
                40,
                """
                        AirlineFlight is a comprehensive flight booking platform that allows users to search, book,
                        and manage their flights with ease.
                        The platform offers a user-friendly interface,
                        secure payment options, and real-time flight updates to enhance the travel experience.
                        It also provides features like seat selection, baggage management,
                        and customer support to ensure a seamless journey for travelers.
                        """,
                List.of("flight booking", "travel", "user-friendly", "secure payment", "real-time updates"),
                List.of("Use simple language", "Be concise", "70% Stories, 25% Tasks, 5% Bugs"),
                List.of(),
                true
        );
        long end = System.currentTimeMillis();
        System.out.println("Issue generation completed in " + (end - start) + " ms.");
    }
}
