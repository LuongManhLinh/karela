package io.ratsnake.integrations.jira.llm;

import io.ratsnake.integrations.jira.dto.IssuesGenerateInput;
import io.ratsnake.integrations.jira.dto.IssuesGenerateOutput;
import io.ratsnake.llm.aiservice.AIService;
import io.ratsnake.llm.models.DynamicModel;

import static io.ratsnake.util.LanguageProcessor.jsonify;
import static io.ratsnake.util.LanguageProcessor.secureParseJson;

public class IssuesGenerateAIService extends AIService<IssuesGeneratePrompt> {
    public IssuesGenerateAIService(DynamicModel<IssuesGeneratePrompt> model, int maxRetries) {
        super(model, maxRetries);
    }

    public IssuesGenerateAIService(DynamicModel<IssuesGeneratePrompt> model) {
        super(model);
    }

    public IssuesGenerateOutput generateIssues(IssuesGenerateInput input, boolean requireStructuredIssues) {
        return executeWithRetries(() -> {
            String outputJson;
            if (requireStructuredIssues) {
                outputJson = model().generateStructuredIssues(jsonify(input));
            } else {
                outputJson = model().generateNaturalIssues(jsonify(input));
            }
            return secureParseJson(
                    outputJson,
                    IssuesGenerateOutput.class
            );
        }, "GENERATE_ISSUES");
    }
}
