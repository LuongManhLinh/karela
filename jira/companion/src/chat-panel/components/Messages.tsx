import React from "react";
import {
  Box,
  Inline,
  Spinner,
  Stack,
  Tag,
  Text,
  AdfRenderer,
  DocNode,
} from "@forge/react";
import { markdownToAdf } from "marklassian";

import { ChatMessageDto, AnalysisProgressMessageDto } from "../types/chats";

const bubbleStyles = {
  user: {
    backgroundColor: "color.background.neutral" as const,
    textColor: "color.text" as const,
    alignInline: "end" as const,
  },
  ai: {
    backgroundColor: "color.background.neutral" as const,
    textColor: "color.text" as const,
    alignInline: "start" as const,
  },
  system: {
    backgroundColor: "elevation.surface.raised" as const,
    textColor: "color.text.subtle" as const,
    alignInline: "center" as const,
  },
  tool: {
    backgroundColor: "elevation.surface.sunken" as const,
    textColor: "color.text" as const,
    alignInline: "start" as const,
  },
  analysis_progress: {
    backgroundColor: "color.background.accent.lime.subtlest" as const,
    textColor: "color.text.subtle" as const,
    alignInline: "start" as const,
  },
};

export const MessageBubble = ({
  message,
}: {
  message: ChatMessageDto | AnalysisProgressMessageDto;
}) => {
  const style = bubbleStyles[message.role];
  return (
    <Inline
      key={message.id}
      alignInline={style.alignInline}
      alignBlock="stretch"
      space="space.050"
      shouldWrap={false}
    >
      <Box
        xcss={{
          maxWidth: "85%",
          padding: "space.200",
          backgroundColor: style.backgroundColor,
          borderRadius: "border.radius",
        }}
      >
        <Stack space="space.050">
          {message.role === "analysis_progress" && (
            <Stack>
              <Text size="small">
                {" "}
                Analysis {
                  (message as AnalysisProgressMessageDto).analysis_id
                }{" "}
              </Text>
              <Inline alignBlock="center" space="space.050">
                <Tag
                  text={(message as AnalysisProgressMessageDto).status}
                  appearance="rounded"
                />
                {(message as AnalysisProgressMessageDto).status === "PENDING" ||
                (message as AnalysisProgressMessageDto).status ===
                  "IN_PROGRESS" ? (
                  <Spinner size="small" />
                ) : null}
              </Inline>
            </Stack>
          )}
          <Text color={style.textColor}>{message.content}</Text>
        </Stack>
      </Box>
    </Inline>
  );
};

export const AgentMessage = ({ message }: { message: string }) => {
  const adfContent = markdownToAdf(message) as DocNode;

  return (
    <Box>
      <AdfRenderer document={adfContent} />
    </Box>
  );
};
