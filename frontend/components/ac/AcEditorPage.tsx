"use client";

import { Paper, Typography } from "@mui/material";

export default function AcEditorPage() {
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
        Welcome to Gherkin Editor
      </Typography>
      <Typography color="text.secondary">
        Select a Story and an Acceptance Criteria from the sidebar to start
        editing, or create a new one.
      </Typography>
    </Paper>
  );
}
