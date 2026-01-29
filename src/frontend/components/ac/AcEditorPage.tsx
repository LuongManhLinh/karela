"use client";

import { Paper, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

export default function AcEditorPage() {
  const t = useTranslations("ac.AcEditorPage");
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        textAlign: "center",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
      }}
    >
      <Typography variant="h5" color="text.primary" gutterBottom>
        {t("welcome")}
      </Typography>
      <Typography color="text.secondary">
        {t("instruction")}
      </Typography>
    </Paper>
  );
}
