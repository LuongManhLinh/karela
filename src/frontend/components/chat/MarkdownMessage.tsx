"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Box, useTheme, IconButton, Typography } from "@mui/material";
import { ContentCopyRounded } from "@mui/icons-material";
import { useThemeMode } from "../../providers/ThemeProvider";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownMessageProps {
  content: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  content,
}) => {
  const theme = useTheme();

  return (
    <Box>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            // FIX: Destructure 'ref' here to remove it from 'rest'
            const { children, className, node, ref, ...rest } = props;

            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : undefined;

            if (match) {
              return (
                <Box
                  sx={{
                    borderRadius: 1,
                    overflow: "hidden",
                    bgcolor: "secondaryContainer",
                  }}
                >
                  {/* Header */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: "onSecondaryContainer",
                      px: 1,
                    }}
                  >
                    {/* Language */}
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        letterSpacing: 0.5,
                      }}
                    >
                      {language || "text"}
                    </Typography>

                    {/* Copy Button */}
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          String(children).replace(/\n$/, ""),
                        )
                      }
                      sx={{
                        borderRadius: 2,
                        transition: "0.2s",
                      }}
                    >
                      <ContentCopyRounded fontSize="inherit" />
                    </IconButton>
                  </Box>

                  {/* Code */}
                  <SyntaxHighlighter
                    {...rest}
                    children={String(children).replace(/\n$/, "")}
                    style={theme.palette.mode === "dark" ? oneDark : oneLight}
                    language={language}
                    customStyle={{
                      borderRadius: 0,
                      margin: 0,
                    }}
                  />
                </Box>
              );
            }

            return (
              <code className={className} {...rest}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};
