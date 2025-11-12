import React from "react";
import { Box, Inline, Spinner, Stack, Tag, Text } from "@forge/react";
import { ChatMessageDto, ChatRole } from "./types";
import type { TextColor } from "@atlaskit/primitives/dist/types/compiled/components/types";
import type {
  BackgroundColor,
  Space,
} from "@atlaskit/primitives/dist/types/xcss/style-maps.partial";

const bubbleStyles = {
  user: {
    backgroundColor: "color.background.selected.bold" as BackgroundColor,
    textColor: "color.text.inverse" as TextColor,
    alignInline: "end" as const,
  },
  ai: {
    backgroundColor: "color.background.neutral" as BackgroundColor,
    textColor: "color.text" as TextColor,
    alignInline: "start" as const,
  },
  system: {
    backgroundColor: "elevation.surface.raised" as BackgroundColor,
    textColor: "color.text.subtle" as TextColor,
    alignInline: "center" as const,
  },
  tool: {
    backgroundColor: "elevation.surface.sunken" as BackgroundColor,
    textColor: "color.text" as TextColor,
    alignInline: "start" as const,
  },
  analysis_progress: {
    backgroundColor: "elevation.surface" as BackgroundColor,
    textColor: "color.text.subtle" as TextColor,
    alignInline: "center" as const,
  },
};

const roleLabel = (role: ChatRole) => {
  switch (role) {
    case "user":
      return "You";
    case "ai":
      return "Agent";
    case "system":
      return "System";
    case "tool":
      return "Tool";
    case "analysis_progress":
      return "Analysis";
    default:
      return role;
  }
};

export const MessageBubble = ({ message }: { message: ChatMessageDto }) => {
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
          <Inline alignInline="start" space="space.100" alignBlock="center">
            <Text weight="medium" color="color.text.subtle">
              {roleLabel(message.role)}
            </Text>
            {message.role === "analysis_progress" && (
              <>
                <Spinner size="small" />
                <Tag text="In progress" />
              </>
            )}
          </Inline>
          <Text color={style.textColor}>{message.content}</Text>
        </Stack>
      </Box>
    </Inline>
  );
};
