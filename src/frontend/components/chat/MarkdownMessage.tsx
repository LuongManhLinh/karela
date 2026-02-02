"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Box, useTheme } from "@mui/material";
import { useThemeMode } from "../../providers/ThemeProvider";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownMessageProps {
  content: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  content,
}) => {
  const theme = useTheme();
  const { mode } = useThemeMode();

  return (
    <Box
      sx={
        {
          /* ... styles ... */
        }
      }
    >
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
                    position: "relative",
                    marginTop: "1.5em",
                    marginBottom: "1.5em",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      backgroundColor: theme.palette.text.secondary,
                      color: theme.palette.background.paper,
                      px: 1.5,
                      py: 0.5,
                      borderBottomLeftRadius: "8px",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      zIndex: 1,
                      userSelect: "none",
                    }}
                  >
                    {language}
                  </Box>
                  {/* Now 'rest' does not contain 'ref', solving the type error */}
                  <SyntaxHighlighter
                    {...rest}
                    children={String(children).replace(/\n$/, "")}
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: "24px 16px 16px 16px",
                      backgroundColor: mode === "light" ? "#1e1e1e" : "#0d1117",
                      fontSize: "0.875rem",
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
