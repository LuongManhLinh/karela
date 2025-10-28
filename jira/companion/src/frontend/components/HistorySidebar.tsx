import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Inline,
  Stack,
  Tag,
  TagGroup,
  Text,
  xcss,
  ProgressBar,
} from "@forge/react";
import { AnalysisBrief } from "../types/defect";

const HistoryItem = ({
  item,
  onClick,
  selectedId,
}: {
  item: AnalysisBrief;
  onClick: (id: string) => void;
  selectedId?: string;
}) => {
  const isRunning = item.status === "PENDING" || item.status === "IN_PROGRESS";
  const startedAt = new Date(item.startedAt);
  const [duration, setDuration] = useState<string>("");

  useEffect(() => {
    const formatDuration = (ms: number) => {
      // Convert to seconds with rounded to 2 decimal places
      const seconds = (ms / 1000).toFixed(2);
      return `${seconds} s`;
    };

    const updateDuration = () => {
      const now = isRunning ? new Date() : new Date(item.endedAt!);
      const diff = now.getTime() - startedAt.getTime();
      setDuration(formatDuration(diff));
    };

    // Initial call immediately
    updateDuration();

    if (isRunning) {
      const interval = setInterval(updateDuration, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning, item.endedAt, startedAt]);

  return (
    <Box
      xcss={{
        padding: "space.100",
        width: "100%",
        ":hover": {
          backgroundColor: "color.background.accent.lime.subtlest",
        },
        backgroundColor:
          selectedId === item.id
            ? "color.background.accent.lime.subtler"
            : undefined,
      }}
    >
      {isRunning ? <ProgressBar value={0} isIndeterminate /> : null}
      <Stack alignInline="start">
        <Text size="medium" weight="bold">
          {item.title}
        </Text>
        <TagGroup>
          <Tag text={item.status} color="blueLight" />
          <Tag text={duration} color="greyLight" />
        </TagGroup>
        <Button
          iconAfter="chevron-right"
          spacing="compact"
          appearance="primary"
          onClick={() => onClick(item.id)}
        >
          View
        </Button>
      </Stack>
    </Box>
  );
};

export default function HistorySidebar({
  history,
  onClick,
  selectedId,
}: {
  history: AnalysisBrief[];
  onClick: (id: string) => void;
  selectedId?: string;
}) {
  return (
    <Stack space="space.100">
      {history.map((item) => (
        <HistoryItem
          item={item}
          key={item.id}
          onClick={onClick}
          selectedId={selectedId}
        />
      ))}
    </Stack>
  );
}
