package io.ratsnake.integrations.jira;

import io.ratsnake.integrations.jira.dto.IssuesCreateRequest;
import io.ratsnake.integrations.jira.dto.IssuesCreateResponse;
import io.ratsnake.integrations.jira.dto.SearchRequest;
import io.ratsnake.integrations.jira.dto.SearchResponse;
import retrofit2.Call;
import retrofit2.http.*;

public interface JiraApi {
    // Platform search: issues of type Story/Task in a project
    @GET("/rest/api/3/search/jql")
    Call<SearchResponse> searchIssues(
            @Query(value = "jql", encoded = true) String jql,
            @Query("fields") String fields,
            @Query("maxResults") Integer maxResults,
            @Query("expand") String expand
    );

    @POST("/rest/api/3/search/jql")
    Call<SearchResponse> searchIssues(@Body SearchRequest body);

    // Agile board issues (optional)
    @GET("/rest/agile/1.0/board/{boardId}/issue")
    Call<SearchResponse> boardIssues(
            @Path("boardId") long boardId,
            @Query("jql") String jql,
            @Query("maxResults") Integer maxResults);

    @GET("/rest/api/3/project/{projectIdOrKey}")
    Call<Object> getProject(
            @Path("projectIdOrKey") String projectIdOrKey);

    @Headers({"Content-Type: application/json"})
    @POST("/rest/api/3/issue/bulk")
    Call<IssuesCreateResponse> createIssues(@Body IssuesCreateRequest request);
}
