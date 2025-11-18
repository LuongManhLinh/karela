"use client";

import React from "react";
import { Box, Paper, Typography, Avatar, useTheme } from "@mui/material";
import { Person, SmartToy } from "@mui/icons-material";
import { MarkdownMessage } from "./MarkdownMessage";
import type { ChatMessageDto } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  message: ChatMessageDto;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const theme = useTheme();
  const isUser = message.role === "user";
  const isAgent = message.role === "agent";

  if (isUser) {
    const content =
      typeof message.content === "string"
        ? message.content
        : JSON.stringify(message.content);

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mb: 2,
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            maxWidth: "75%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <Paper
            elevation={2}
            sx={{
              p: 2.5,
              borderRadius: "16px 0px 16px 16px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              boxShadow: "0 4px 16px rgba(102, 126, 234, 0.3)",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.6,
              }}
            >
              {content}
            </Typography>
          </Paper>
        </Box>
      </Box>
    );
  }

  if (isAgent) {
    const content =
      typeof message.content === "string"
        ? message.content
        : JSON.stringify(message.content);
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          mb: 4,
          gap: 2,
          maxWidth: "85%",
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            pt: 0.5,
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </Box>
      </Box>
    );
  }

  return null;
};
