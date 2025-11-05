package io.ratsnake.llm.example;

import io.ratsnake.integrations.jira.JiraApiService;
import io.ratsnake.integrations.jira.jql.FieldName;
import io.ratsnake.integrations.jira.jql.IssueTypeName;
import io.ratsnake.integrations.jira.jql.Jql;
import io.ratsnake.integrations.jira.jql.Order;

import java.io.IOException;
import java.util.List;

public class JqlExample {
    public static void main(String[] args) throws IOException {
        var jiraApiService = new JiraApiService();
        var jql = Jql.builder()
                .project("AF")
                .and()
                .issuetypeIn(IssueTypeName.STORY, IssueTypeName.TASK, IssueTypeName.BUG)
                .orderBy(
                        FieldName.CREATED,
                        Order.ASC
                )
                .build();
        System.out.println(jql);
//        var jiraIssues = jiraApiService.searchIssues(
//                jql,
//                List.of(FieldName.SUMMARY, FieldName.ISSUE_TYPE, FieldName.DESCRIPTION),
//                50,
//                true
//        );
    }
}
