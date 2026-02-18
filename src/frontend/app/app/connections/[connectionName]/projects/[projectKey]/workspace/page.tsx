"use client";

import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

export default function WorkspaceIndexPage() {
  const t = useTranslations("workspace.WorkspacePage");

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        p: 4,
      }}
    >
      <Typography variant="h6" color="text.secondary" textAlign="center">
        {t("selectStory")}
      </Typography>
    </Box>
  );
}
