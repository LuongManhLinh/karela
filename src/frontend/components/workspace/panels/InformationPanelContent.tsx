"use client";

import React from "react";
import { Box, Typography, Divider, Paper, Stack, Switch } from "@mui/material";
import { useTranslations } from "next-intl";
import type { StoryDto } from "@/types/connection";
import { MarkdownMessage } from "@/components/chat/MarkdownMessage";

interface InformationPanelContentProps {
  story: StoryDto | null;
  loading?: boolean;
}

export const InformationPanelContent: React.FC<
  InformationPanelContentProps
> = ({ story, loading }) => {
  const t = useTranslations("workspace.WorkspacePage");

  const [renderMarkdown, setRenderMarkdown] = React.useState(false);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <Typography color="text.secondary">Loading...</Typography>
      </Box>
    );
  }

  if (!story) {
    return (
      <Typography color="text.secondary" textAlign="center">
        {t("selectStory")}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4, px: 2 }}>
      {/* Summary Section */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
          {t("summary")}
        </Typography>
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mt: 1,
            bgcolor: "surfaceContainer",
          }}
        >
          <Typography variant="body1">
            {story.summary || t("noSummary")}
          </Typography>
        </Paper>
      </Box>

      {/* Description Section */}
      <Box>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography
            variant="subtitle2"
            fontWeight={600}
            color="text.secondary"
          >
            {t("description")}
          </Typography>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Markdown
            </Typography>
            <Switch
              checked={renderMarkdown}
              onChange={(_e, checked) => setRenderMarkdown(checked)}
              color="primary"
              size="small"
            />
          </Box>
        </Stack>
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mt: 1,
            bgcolor: "surfaceContainer",

            overflow: "auto",
          }}
        >
          {renderMarkdown ? (
            <MarkdownMessage
              content={story.description || t("noDescription")}
            />
          ) : (
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {story.description || t("noDescription")}
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default InformationPanelContent;
