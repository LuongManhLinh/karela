import React from "react";
import {
  Box,
  Icon,
  Inline,
  Stack,
  Strong,
  Text,
  ProgressBar,
  Heading,
} from "@forge/react";

const ActionPanel = ({
  idleMessage,
  isRunning,
  runMessage,
  notification,
}: {
  idleMessage: string;
  isRunning: boolean;
  runMessage: string;
  notification: string | null;
}) => {
  return (
    <Box>
      {isRunning ? <ProgressBar value={0} isIndeterminate /> : null}

      <Inline space="space.100" alignBlock="center">
        <Icon
          glyph="ai-chat"
          color="color.icon.accent.purple"
          label="RatSnake"
          size="large"
        />
        <Stack>
          <Heading size="small">{isRunning ? runMessage : idleMessage}</Heading>
          {notification ? (
            <Text color="color.text" maxLines={1}>
              {notification}
            </Text>
          ) : null}
        </Stack>
      </Inline>
    </Box>
  );
};

export default ActionPanel;
