package io.ratsnake.integrations.server.service;

import io.ratsnake.integrations.data.entity.Analysis;
import io.ratsnake.integrations.data.entity.AnalysisDetail;
import io.ratsnake.integrations.data.entity.Defect;
import io.ratsnake.integrations.data.repository.AnalysisRepository;
import io.ratsnake.integrations.jira.JiraApiService;
import io.ratsnake.integrations.jira.jql.FieldName;
import io.ratsnake.integrations.jira.jql.IssueTypeName;
import io.ratsnake.integrations.jira.jql.Jql;
import io.ratsnake.integrations.jira.jql.Order;
import io.ratsnake.integrations.server.config.RabbitMQConfig;
import io.ratsnake.llm.adapter.DefectAiAdapter;
import io.ratsnake.llm.adapter.DefectQAAdapter;
import io.ratsnake.llm.adapter.FormulationAiAdapter;
import io.ratsnake.llm.dto.*;
import io.ratsnake.llm.dto.in.GenerateGherkinInput;
import io.ratsnake.llm.dto.in.GenerateUserStoryInput;
import io.ratsnake.llm.dto.out.GenerateGherkinOutput;
import io.ratsnake.llm.dto.out.ImproveItemOutput;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

import static io.ratsnake.util.LanguageProcessor.jsonify;
import static io.ratsnake.util.LanguageProcessor.safeJsonify;

@Service
@RequiredArgsConstructor
public class DefectConsumer {
    @Autowired
    private final DefectAiAdapter defectAiAdapter;

    @Autowired
    private final DefectQAAdapter defectQAAdapter;

    @Autowired
    private final JiraApiService jiraApiService;

    @Autowired
    private final AnalysisRepository analysisRepository;

    @RabbitListener(queues = RabbitMQConfig.DEFECT_QUEUE, concurrency = "5-10")
    public void analyzeWorkItems(String analysisId) {
        var analysis = analysisRepository.findById(analysisId).orElseThrow();
        analysis.setStatus(Analysis.Status.IN_PROGRESS);
        analysis = analysisRepository.save(analysis);

        String projectKey = analysis.getProjectKey();
        System.out.println("Analyzing work items for project: " + projectKey);
        long startTime = System.currentTimeMillis();

        try {
            var jiraIssues = jiraApiService.searchIssues(
                    Jql.builder()
                            .project(projectKey)
                            .and()
                            .issuetypeIn(IssueTypeName.STORY, IssueTypeName.TASK, IssueTypeName.BUG)
                            .orderBy(
                                    FieldName.CREATED,
                                    Order.ASC
                            )
                            .build(),
                    List.of(FieldName.SUMMARY, FieldName.ISSUE_TYPE, FieldName.DESCRIPTION),
                    50,
                    true
            );

            System.out.println("Fetched: \n" + jsonify(jiraIssues));

            List<WorkItemWithRef> workItems = jiraIssues.stream()
                    .map(issue ->
                            WorkItemWithRef.builder()
                                    .id(issue.getKey())
                                    .title(issue.getFields().getSummary())
                                    .type(issue.getFields().getIssuetype().getName())
                                    .description(issue.getRenderedFields().getDescription())
                                    .relatedWorkItemIds(List.of())
                                    .build()
                    )
                    .toList();

            var defectsLlm = defectAiAdapter.checkDefects(workItems);

            var response = defectQAAdapter.respondFromDetectedDefects(
                    defectsLlm,
                    workItems.stream()
                            .map(iwRef ->
                                    WorkItem.builder()
                                            .id(iwRef.getId())
                                            .type(iwRef.getType())
                                            .title(iwRef.getTitle())
                                            .description(iwRef.getDescription())
                                            .build())
                            .toList()
            );

            var analysisDetail = AnalysisDetail.builder()
                    .analysis(analysis)
                    .summary(response.getReport().getContent())
                    .build();

            var defects = defectsLlm.stream()
                    .map(defect -> Defect.builder()
                            .analysisDetail(analysisDetail)
                            .type(Defect.Type.valueOf(defect.getType().toUpperCase(Locale.ROOT)))
                            .workItemIds(defect.getWorkItemIds())
                            .severity(Defect.Severity.valueOf(defect.getSeverity().toUpperCase(Locale.ROOT)))
                            .explanation(defect.getExplanation())
                            .confidence(defect.getConfidence())
                            .suggestedImprovements(defect.getSuggestedImprovements())
                            .build()
                    )
                    .toList();

            analysisDetail.setDefects(defects);

            analysis.setTitle(response.getReport().getTitle());
            analysis.setAnalysisDetail(analysisDetail);
            analysis.setStatus(Analysis.Status.DONE);
            System.out.println("Defect analysis completed in " + (System.currentTimeMillis() - startTime) + " ms");
        } catch (Exception e) {
            e.printStackTrace();
            analysis.setTitle("Failed");
            analysis.setStatus(Analysis.Status.FAILED);
            analysis.setErrorMessage(e.getMessage());
        } finally {
            analysis.setEndedAt(java.time.LocalDateTime.now());
            analysisRepository.save(analysis);
        }
    }
}
