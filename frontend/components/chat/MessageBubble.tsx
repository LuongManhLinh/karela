"use client";

import React from "react";
import { Box, Paper, Typography, Avatar, useTheme } from "@mui/material";
import type { ChatMessageDto } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import type { Components } from "react-markdown";

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
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            textAlign: "left",
            maxWidth: "100%",
            "& p": {
              margin: "0 0 1em 0",
              "&:last-child": {
                marginBottom: 0,
              },
            },
            "& code": {
              backgroundColor: "rgba(175, 184, 193, 0.2)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "0.875rem",
              fontFamily: "monospace",
            },
            "& pre": {
              backgroundColor: "#1e1e1e",
              borderRadius: "6px",
              padding: "12px",
              overflowX: "auto",
              margin: "0.75em 0",
              "& code": {
                backgroundColor: "transparent",
                padding: 0,
                fontSize: "0.875rem",
              },
            },
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");

                if (!inline && match) {
                  // Render fenced code blocks with language via SyntaxHighlighter
                  return (
                    <SyntaxHighlighter
                      style={atomOneDark as any}
                      language={match[1]}
                      PreTag="div"
                      wrapLongLines
                      customStyle={{
                        borderRadius: "16px",
                        margin: "0.75em 0",
                        padding: "12px",
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  );
                }

                // Let ReactMarkdown handle inline code and plain code blocks naturally
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </Box>
      </Box>
    );
  }

  return null;
};
