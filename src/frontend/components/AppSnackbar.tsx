"use client";

import React from "react";
import { Snackbar, Alert } from "@mui/material";

interface AppSnackbarProps {
  open: boolean;
  message: string;
  onClose: () => void;
  severity?: "error" | "warning" | "info" | "success";
}

export const AppSnackbar: React.FC<AppSnackbarProps> = ({
  open,
  message,
  onClose,
  severity = "info",
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
};
