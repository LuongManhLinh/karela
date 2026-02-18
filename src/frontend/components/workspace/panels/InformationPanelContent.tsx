"use client";

import React from "react";
import { Box, Typography, Divider, Paper } from "@mui/material";
import { useTranslations } from "next-intl";
import type { StoryDto } from "@/types/connection";

interface InformationPanelContentProps {
  story: StoryDto | null;
  loading?: boolean;
}

export const InformationPanelContent: React.FC<
  InformationPanelContentProps
> = ({ story, loading }) => {
  const t = useTranslations("workspace.WorkspacePage");

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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Summary Section */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
          {t("summary")}
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mt: 1,
            bgcolor: "background.default",
          }}
        >
          <Typography variant="body1">
            {story.summary || t("noSummary")}
          </Typography>
        </Paper>
      </Box>

      <Divider />

      {/* Description Section */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
          {t("description")}
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mt: 1,
            bgcolor: "background.default",
            maxHeight: 300,
            overflow: "auto",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {story.description || t("noDescription")}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default InformationPanelContent;
