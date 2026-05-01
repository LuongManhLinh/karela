"use client";

import React from "react";
import { Box, Button, Paper, Typography, useTheme } from "@mui/material";
import type { ChatMessageDto } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SyntaxHighlighter from "react-syntax-highlighter";
import {
  atomOneDark,
  atomOneLight,
} from "react-syntax-highlighter/dist/esm/styles/hljs";

interface MessageBubbleProps {
  message: ChatMessageDto;
}

interface CodeRendererProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  themeMode: "light" | "dark";
}

const CodeRenderer: React.FC<CodeRendererProps> = ({
  inline,
  className,
  children,
  themeMode,
}) => {
  const [copied, setCopied] = React.useState(false);
  const match = /language-([\w-]+)/.exec(className || "");
  const language = match?.[1] || "text";
  const codeText = String(children).replace(/\n$/, "");

  if (inline) {
    return <code className={className}>{children}</code>;
  }

  if (match) {
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(codeText);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      } catch {
        setCopied(false);
      }
    };

    return (
      <Box
        sx={{
          borderRadius: 1,
          overflow: "hidden",
          my: 1,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.5,
            py: 0.75,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              textTransform: "lowercase",
              letterSpacing: 0.3,
            }}
          >
            {language}
          </Typography>
          <Button size="small" variant="text" onClick={handleCopy}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </Box>

        <SyntaxHighlighter
          style={
            themeMode === "dark" ? (atomOneDark as any) : (atomOneLight as any)
          }
          language={language}
          wrapLongLines
          customStyle={{
            margin: 0,
            borderRadius: 0,
            padding: 16,
          }}
        >
          {codeText}
        </SyntaxHighlighter>
      </Box>
    );
  }

  return <code className={className}>{children}</code>;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === "user";
  const isAgent = message.role === "agent";

  const theme = useTheme();

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
        }}
      >
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: "surfaceContainerHighest",
            color: "onSurface",
            maxWidth: "75%",
          }}
        >
          <Typography
            variant="body1"
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: 1.5,
            }}
          >
            {content}
          </Typography>
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
              margin: "0.3em 0",
              lineHeight: 1.5,
            },
            "& li": {
              lineHeight: 1.5,
            },
            "& ul, & ol": {
              margin: "0.3em 0",
              paddingLeft: "1.4em",
            },
            "& pre": {
              margin: "0.5em 0",
            },
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ inline, className, children }: any) {
                return (
                  <CodeRenderer
                    inline={inline}
                    className={className}
                    themeMode={theme.palette.mode}
                  >
                    {children}
                  </CodeRenderer>
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
