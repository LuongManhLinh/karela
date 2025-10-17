package io.ratsnake.integrations.server;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.ratsnake.integrations.jira.JiraApiService;
import io.ratsnake.integrations.jira.jql.FieldName;
import io.ratsnake.integrations.jira.jql.IssueTypeName;
import io.ratsnake.integrations.jira.jql.Jql;
import io.ratsnake.integrations.jira.jql.Order;
import io.ratsnake.llm.adapter.DefectAiAdapter;
import io.ratsnake.llm.adapter.DefectQAAdapter;
import io.ratsnake.llm.adapter.FormulationAiAdapter;
import io.ratsnake.llm.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

import static io.ratsnake.util.LanguageProcessor.jsonify;
import static java.util.stream.Collectors.toList;

@Service
@RequiredArgsConstructor
public class LlmService {
    @Autowired
    private DefectAiAdapter defectAiAdapter;

    @Autowired
    private DefectQAAdapter defectQAAdapter;

    @Autowired
    private FormulationAiAdapter formulationAiAdapter;

    private final JiraApiService jiraApiService = new JiraApiService();

    public DefectResponse analyzeWorkItems(String projectKey) throws IOException {
        return null;
//        System.out.println("Analyzing work items for project: " + projectKey);
//        long startTime = System.currentTimeMillis();
//        var jiraIssues = jiraApiService.searchIssues(
//                Jql.builder()
//                        .project(projectKey)
//                        .and()
//                        .issuetypeIn(IssueTypeName.STORY, IssueTypeName.TASK, IssueTypeName.BUG)
//                        .orderBy(
//                                FieldName.CREATED,
//                                Order.ASC
//                        )
//                        .build(),
//                List.of(FieldName.SUMMARY, FieldName.ISSUE_TYPE, FieldName.DESCRIPTION),
//                10,
//                true
//        );
//
//        System.out.println("Fetched " + jiraIssues.size() + " issues from Jira in " + (System.currentTimeMillis() - startTime) + " ms");
//
//        List<WorkItemWithRef> workItems = jiraIssues.stream()
//                .map(issue ->
//                    WorkItemWithRef.builder()
//                            .id(issue.getId())
//                            .title(issue.getFields().getSummary())
//                            .type(issue.getFields().getIssuetype().getName())
//                            .description(issue.getRenderedFields().getDescription())
//                            .relatedWorkItemIds(List.of())
//                            .build()
//                )
//                .toList();
//        System.out.println("Mapped issues to " + workItems.size() + " work items.");
//        System.out.println(jsonify(workItems));
//        var defectOutputs = defectAiAdapter.checkDefects(workItems)
//                        .stream().filter(output -> !output.getDefects().isEmpty())
//                        .toList();
//        System.out.println("Detected defects: \n" + jsonify(defectOutputs));
//        var result = defectQAAdapter.respondFromDetectedDefects(
//                defectOutputs,
//                workItems.stream()
//                        .map(iwRef ->
//                                WorkItem.builder()
//                                .id(iwRef.getId())
//                                .type(iwRef.getType())
//                                .title(iwRef.getTitle())
//                                .description(iwRef.getDescription())
//                                .build())
//                        .toList()
//        );
//
//        System.out.println("Defect analysis completed in " + (System.currentTimeMillis() - startTime) + " ms");
//        return result;
    }

    public ImproveItemOutput improveUserStory(GenerateUserStoryInput input) {
        return defectAiAdapter.improveStructuredUserStory(input);
    }

    public ImproveItemOutput improveGherkin(GenerateGherkinInput input) {
        return defectAiAdapter.improveStructuredGherkin(input);
    }

    public GenerateGherkinOutput suggestWhileWritingGherkin(GenerateGherkinInput input) {
        return formulationAiAdapter.suggestWhileWritingGherkin(input);
    }
}
