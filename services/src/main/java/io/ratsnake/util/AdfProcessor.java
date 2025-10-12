package io.ratsnake.util;

import com.atlassian.adf.markdown.MarkdownParser;
import com.atlassian.adf.model.node.Doc;

public class AdfProcessor {
    private static final MarkdownParser markdownParser = new MarkdownParser();

    public static Doc parseMarkdown(String markdown) {
        return markdownParser.unmarshall(markdown);
    }
}
