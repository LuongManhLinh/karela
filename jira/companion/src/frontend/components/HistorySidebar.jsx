import React from "react";
import { Box, Button, Inline, Stack, Strong, Text, xcss } from "@forge/react";

const cardStyle = xcss({
  padding: "space.100",
  width: "100%",
  ":hover": {
    backgroundColor: "color.background.accent.lime.subtlest",
  },
});

const HistoryItem = ({ item }) => {
  return (
    <Box xcss={cardStyle}>
      <Stack alignInline="start">
        <Strong size="large" maxLines={1}>
          {item.title}
        </Strong>
        <Text size="small" maxLines={1}>
          {item.timestamp}
        </Text>
        <Button
          iconAfter="chevron-right"
          spacing="compact"
          appearance="primary"
        >
          View
        </Button>
      </Stack>
    </Box>
  );
};

export default function HistorySidebar({ history }) {
  return (
    <Stack space="space.100">
      {history.map((item) => (
        <HistoryItem item={item} />
      ))}
    </Stack>
  );
}
