import { useMemo } from "react";
import { Box, xcss, Stack } from "@atlaskit/primitives";
import Button from "@atlaskit/button";
import SectionMessage, {
  SectionMessageAction,
} from "@atlaskit/section-message";
import type { SuggestionItem } from "../types";
import SuggestionItemRow from "./SuggestionItem";
// import Heading from "@atlaskit/heading";
// import Link from "@atlaskit/link";
import { marked } from "marked";

type Props = {
  markdown: string;
  suggestions: SuggestionItem[];
  onToggle: (id: string) => void;
  onCompleteAll: () => void;
  isRunning: boolean;
  hadError?: boolean;
  onRetry?: () => void;
};

const containerStyles = xcss({
  flex: 1,
  height: "100vh",
  overflowY: "auto",
  backgroundColor: "color.background.neutral",
});

const contentStyles = xcss({
  color: "color.text",
  marginLeft: "auto",
  marginRight: "auto",
  padding: "space.400",
});

const headingStyles = xcss({
  marginBottom: "space.200",
  color: "color.text",
  fontWeight: "bold",
});

const skeletonStyles = xcss({
  height: "120px",
  backgroundColor: "color.background.neutral.hovered",
  borderRadius: "border.radius.100",
  marginTop: "space.100",
  marginBottom: "space.100",
});

const skeletonTextStyles = xcss({
  height: "28px",
  backgroundColor: "color.background.neutral.hovered",
  borderRadius: "border.radius.050",
  width: "40%",
});

const suggestionsContainerStyles = xcss({
  marginTop: "space.400",
  marginBottom: "space.100",
});

const suggestionListStyles = xcss({
  marginLeft: "space.100",
  opacity: "0.4",
});

const suggestionListActiveStyles = xcss({
  opacity: "1",
});

const skeletonCheckboxStyles = xcss({
  height: "28px",
  backgroundColor: "color.background.neutral.hovered",
  borderRadius: "border.radius.050",
  marginBottom: "space.100",
});

const markdownToHtml = (markdown: string) => {
  return marked(markdown, { breaks: true });
};

export default function RightPanel({
  markdown,
  suggestions,
  onToggle,
  onCompleteAll,
  isRunning,
  hadError,
  onRetry,
}: Props) {
  const list = useMemo(() => suggestions, [suggestions]);
  const html = markdownToHtml(markdown);
  return (
    <Box xcss={containerStyles}>
      <Box xcss={contentStyles}>
        {isRunning ? (
          <Box>
            <Box xcss={skeletonTextStyles} />
            <Box xcss={skeletonStyles} />
            <Box xcss={skeletonStyles} />
          </Box>
        ) : hadError ? (
          <SectionMessage
            appearance="error"
            title="Error fetching fresh data"
            actions={[
              <SectionMessageAction onClick={onRetry}>
                Retry
              </SectionMessageAction>,
            ]}
          >
            <p>Failed to fetch fresh data. Displaying fallback.</p>
          </SectionMessage>
        ) : null}
        <Box>
          <div dangerouslySetInnerHTML={{ __html: html }} />
          {/* <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <Heading level="h600" {...props} />,
              h2: ({ node, ...props }) => <Heading level="h500" {...props} />,
              p: ({ node, ...props }) => <Text {...props} />,
              a: ({ node, ...props }) => <Link {...props} />,
              li: ({ node, ...props }) => (
                <li style={{ marginLeft: 16 }} {...props} />
              ),
            }}
          >
            {markdown}
          </ReactMarkdown> */}
        </Box>
        <Box xcss={suggestionsContainerStyles}>
          <Box
            as="h1"
            xcss={headingStyles}
            backgroundColor="color.background.accent.blue.bolder"
          >
            Suggestionsxxx:
          </Box>
          {isRunning ? (
            <Stack space="space.100">
              <Box xcss={skeletonCheckboxStyles} />
              <Box xcss={skeletonCheckboxStyles} />
              <Box xcss={skeletonCheckboxStyles} />
            </Stack>
          ) : null}
          <Stack
            space="space.100"
            xcss={[
              suggestionListStyles,
              !isRunning && suggestionListActiveStyles,
            ]}
          >
            {list.map((s) => (
              <SuggestionItemRow
                key={s.id}
                id={s.id}
                text={s.text}
                done={s.done}
                disabled={isRunning}
                onToggle={onToggle}
              />
            ))}
          </Stack>
          <Box style={{ marginTop: "16px" }}>
            <Button
              appearance="primary"
              onClick={onCompleteAll}
              isDisabled={isRunning}
            >
              Complete all
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
