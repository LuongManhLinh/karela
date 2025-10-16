package io.ratsnake.integrations.jira.llm;

import io.ratsnake.integrations.jira.dto.IssuesGenerateInput;
import io.ratsnake.integrations.jira.dto.IssuesGenerateOutput;
import io.ratsnake.llm.adapter.AiAdapter;
import io.ratsnake.llm.models.DynamicModel;

import static io.ratsnake.util.LanguageProcessor.secureParseJson;

public class IssuesGenerateAiAdapter extends AiAdapter<IssuesGeneratePrompt> {
    public IssuesGenerateAiAdapter(DynamicModel<IssuesGeneratePrompt> model, int maxRetries) {
        super(model, maxRetries);
    }

    public IssuesGenerateAiAdapter(DynamicModel<IssuesGeneratePrompt> model) {
        super(model);
    }

    public IssuesGenerateOutput generateIssues(IssuesGenerateInput input, boolean requireStructuredIssues) {
        return executeWithRetries(
                input,
                IssuesGenerateOutput.class,
                requireStructuredIssues ? model()::generateStructuredIssues : model()::generateNaturalIssues,
                "GENERATE_ISSUES"
        );
    }
}
