package io.ratsnake.integrations.jira.llm;

import io.ratsnake.integrations.jira.dto.IssuesGenerateInput;
import io.ratsnake.integrations.jira.dto.IssuesGenerateOutput;
import io.ratsnake.llm.adapter.AiAdapter;
import io.ratsnake.llm.models.DynamicModel;

import static io.ratsnake.util.LanguageProcessor.safeJsonify;
import static io.ratsnake.util.LanguageProcessor.safeParseJson;

public class IssuesGenerateAiAdapter extends AiAdapter<IssuesGeneratePrompt> {
    public IssuesGenerateAiAdapter(DynamicModel<IssuesGeneratePrompt> model) {
        super(model);
    }

    public IssuesGenerateOutput generateIssues(IssuesGenerateInput input, boolean requireStructuredIssues) {
        String inputJson = safeJsonify(input);
        return requireStructuredIssues ?
                model().generateStructuredIssues(inputJson) :
                model().generateNaturalIssues(inputJson);
    }
}
