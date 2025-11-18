"use client";

import React from "react";
import { Box, CircularProgress } from "@mui/material";

interface LoadingSpinnerProps {
  size?: number;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  fullScreen = false,
}) => {
  if (fullScreen) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress size={size} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
      }}
    >
      <CircularProgress size={size} />
    </Box>
  );
};

