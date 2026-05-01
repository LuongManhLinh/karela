"use client";

import React from "react";
import { Snackbar, Alert, Paper } from "@mui/material";

interface AppSnackbarProps {
  open: boolean;
  message: string;
  onClose: () => void;
  severity?: "error" | "warning" | "info" | "success";
  duration?: number;
}

export const AppSnackbar: React.FC<AppSnackbarProps> = ({
  open,
  message,
  onClose,
  severity = "info",
  duration = 3000,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Paper elevation={4} sx={{ bgcolor: "transparent" }}>
        <Alert onClose={onClose} severity={severity} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Paper>
    </Snackbar>
  );
};
