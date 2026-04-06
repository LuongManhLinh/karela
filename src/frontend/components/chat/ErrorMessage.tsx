"use client";

import React from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import { Error as ErrorIcon } from "@mui/icons-material";
import { useTranslations } from "next-intl";
import type { ChatMessageDto } from "@/types/chat";

interface ErrorMessageProps {
  message: ChatMessageDto;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  const t = useTranslations("chat.ErrorMessage");
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
        width: "100%",
        background: "error.main",
        color: "error.contrastText",
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
            variant="body1"
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
