import { useMemo } from "react";
import { Box, xcss } from "@atlaskit/primitives";
import Spinner from "@atlaskit/spinner";
import dayjs from "dayjs";
import type { HistoryItem } from "../types";
import HistoryRow from "./HistoryItem";

type Props = {
  isRunning: boolean;
  message?: string;
  avatarInitials: string;
  history: HistoryItem[];
  onSelectHistory?: (id: string) => void;
};

const containerStyles = xcss({
  width: "320px",
  flexShrink: 0,
  backgroundColor: "color.background.neutral",
  height: "100vh",
  borderRightColor: "color.border",
  borderRightStyle: "solid",
  borderRightWidth: "border.width",
  display: "flex",
  flexDirection: "column",
});

const headerStyles = xcss({
  position: "sticky",
  top: "0px",
  zIndex: "modal",
  backgroundColor: "color.background.neutral",
  padding: "space.200",
  paddingBottom: "space.100",
  borderBottomColor: "color.border",
  borderBottomStyle: "solid",
  borderBottomWidth: "border.width",
});

const avatarContainerStyles = xcss({
  display: "flex",
  alignItems: "center",
  height: "64px",
});

const avatarStyles = xcss({
  width: "48px",
  height: "48px",
  borderRadius: "border.radius.circle",
  backgroundColor: "color.background.neutral.hovered",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "color.text.subtlest",
  fontSize: "18px",
  fontWeight: "600",
  position: "relative",
});

const textContainerStyles = xcss({
  marginLeft: "space.200",
});

const titleStyles = xcss({
  color: "color.text",
  fontSize: "14px",
  fontWeight: "500",
});

const subtitleStyles = xcss({
  color: "color.text.subtlest",
  fontSize: "12px",
  marginTop: "space.050",
});

const listStyles = xcss({
  flex: 1,
  overflowY: "auto",
  padding: "space.200",
  paddingTop: "space.100",
});

const skeletonStyles = xcss({
  marginBottom: "space.100",
});

const skeletonLineStyles = xcss({
  height: "18px",
  backgroundColor: "color.background.neutral.hovered",
  borderRadius: "border.radius.050",
  marginBottom: "space.050",
});

export default function LeftPanel({
  isRunning,
  message,
  avatarInitials,
  history,
  onSelectHistory,
}: Props) {
  const sorted = useMemo(() => {
    return [...history].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  }, [history]);

  return (
    <Box xcss={containerStyles}>
      <Box xcss={headerStyles}>
        <Box xcss={avatarContainerStyles}>
          <Box xcss={avatarStyles}>
            {isRunning && (
              <Box style={{ position: "absolute", top: -5, left: -5 }}>
                <Spinner size="large" />
              </Box>
            )}
            {avatarInitials}
          </Box>
          <Box xcss={textContainerStyles}>
            {isRunning ? (
              <>
                <Box
                  xcss={skeletonLineStyles}
                  style={{ width: "160px", height: "22px" }}
                />
                <Box
                  xcss={skeletonLineStyles}
                  style={{ width: "60px", height: "14px" }}
                />
              </>
            ) : (
              <>
                <Box xcss={titleStyles}>20 Defects - Tasks</Box>
                <Box xcss={subtitleStyles}>
                  {message ??
                    (sorted[0]
                      ? dayjs(sorted[0].timestamp).format("HH:mm")
                      : "")}
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>
      <Box xcss={listStyles}>
        {isRunning
          ? Array.from({ length: 8 }).map((_, i) => (
              <Box key={i} xcss={skeletonStyles}>
                <Box xcss={skeletonLineStyles} style={{ width: "220px" }} />
                <Box
                  xcss={skeletonLineStyles}
                  style={{ width: "60px", height: "12px" }}
                />
              </Box>
            ))
          : sorted.map((h) => (
              <HistoryRow
                key={h.id}
                id={h.id}
                title={h.title}
                timestamp={h.timestamp}
                selected={h.id === "h1"}
                onClick={() => onSelectHistory?.(h.id)}
              />
            ))}
      </Box>
    </Box>
  );
}
