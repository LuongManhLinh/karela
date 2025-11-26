"use client";

import React from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import { Error as ErrorIcon } from "@mui/icons-material";
import type { ChatMessageDto } from "@/types/chat";

interface ErrorMessageProps {
  message: ChatMessageDto;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  const theme = useTheme();
  const content =
    typeof message.content === "string"
      ? message.content
      : JSON.stringify(message.content);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 1,
        mb: 2,
        width: "100%",
        background:
          theme.palette.mode === "light"
            ? "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
            : "linear-gradient(135deg, #742a2a 0%, #5a1f1f 100%)",
        boxShadow: "0 4px 16px rgba(245, 101, 101, 0.2)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        <ErrorIcon
          sx={{
            color: theme.palette.error.main,
            fontSize: 32,
            flexShrink: 0,
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: theme.palette.error.main,
              mb: 1,
            }}
          >
            Error
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.primary,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: 1.6,
            }}
          >
            {content}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};
