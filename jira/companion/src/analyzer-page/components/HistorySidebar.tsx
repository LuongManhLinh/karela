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
  Icon,
  Pressable,
  Lozenge,
} from "@forge/react";
import { AnalysisSummary } from "../types/defect";

const HistoryItem = ({
  item,
  onClick,
  selectedId,
  loadingId,
}: {
  item: AnalysisSummary;
  onClick: (id: string) => void;
  selectedId?: string;
  loadingId?: string;
}) => {
  const isRunning =
    item.status === "PENDING" ||
    item.status === "IN_PROGRESS" ||
    loadingId === item.id;
  const startedAt = new Date(item.started_at);
  const [duration, setDuration] = useState<string>("");

  useEffect(() => {
    const formatDuration = (ms: number) => {
      // Convert to seconds with rounded to 2 decimal places
      const seconds = (ms / 1000).toFixed(2);
      return `${seconds} s`;
    };

    const updateDuration = () => {
      const now =
        item.status === "PENDING" || item.status === "IN_PROGRESS"
          ? new Date()
          : new Date(item.ended_at!);

      const diff = now.getTime() - startedAt.getTime();
      setDuration(formatDuration(diff));
    };

    // Initial call immediately
    updateDuration();

    if (isRunning) {
      const interval = setInterval(updateDuration, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning, item.ended_at, startedAt]);

  return (
    <Pressable
      xcss={{
        padding: "space.100",
        width: "100%",
        ":hover": {
          backgroundColor: "color.background.accent.lime.subtlest",
        },
        backgroundColor:
          selectedId === item.id
            ? "color.background.accent.lime.subtlest"
            : "color.background.neutral.subtle",
        borderRadius: "border.radius",
      }}
      onClick={() => onClick(item.id)}
    >
      {isRunning ? <ProgressBar value={0} isIndeterminate /> : null}
      <Stack alignInline="start">
        <Text weight="bold">
          Analysis{" "}
          {`${item.id.substring(0, 8)}...${item.id.substring(
            item.id.length - 4
          )}`}
        </Text>
        <Inline space="space.100">
          <Lozenge
            appearance={
              item.status === "DONE"
                ? "success"
                : item.status === "FAILED"
                ? "removed"
                : "inprogress"
            }
            isBold
          >
            {item.status}
          </Lozenge>
          <Lozenge isBold>{duration}</Lozenge>
        </Inline>
        {/* <TagGroup>
          <Tag
            text={item.status}
            color={
              item.status === "DONE"
                ? "green"
                : item.status === "FAILED"
                ? "red"
                : "blueLight"
            }
          />
          <Tag text={duration} color="greyLight" />
        </TagGroup> */}
      </Stack>
    </Pressable>
  );
};

export default function HistorySidebar({
  history,
  onClick,
  selectedId,
  loadingId,
}: {
  history: AnalysisSummary[];
  onClick: (id: string) => void;
  selectedId?: string;
  loadingId?: string;
}) {
  return (
    <Stack space="space.100">
      {history.map((item) => (
        <HistoryItem
          item={item}
          key={item.id}
          onClick={onClick}
          selectedId={selectedId}
          loadingId={loadingId}
        />
      ))}
    </Stack>
  );
}
