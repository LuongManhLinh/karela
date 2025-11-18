"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Box, Typography, useTheme } from "@mui/material";
import { useThemeMode } from "../ThemeProvider";

interface MarkdownMessageProps {
  content: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  const theme = useTheme();
  const { mode } = useThemeMode();

  return (
    <Box
      sx={{
        "& p": {
          margin: "0.5em 0",
          lineHeight: 1.7,
        },
        "& p:first-of-type": {
          marginTop: 0,
        },
        "& p:last-of-type": {
          marginBottom: 0,
        },
        "& h1, & h2, & h3, & h4, & h5, & h6": {
          marginTop: "1em",
          marginBottom: "0.5em",
          fontWeight: 600,
          color: theme.palette.text.primary,
        },
        "& h1": { fontSize: "1.5em" },
        "& h2": { fontSize: "1.3em" },
        "& h3": { fontSize: "1.1em" },
        "& ul, & ol": {
          margin: "0.5em 0",
          paddingLeft: "1.5em",
        },
        "& li": {
          margin: "0.25em 0",
        },
        "& code": {
          backgroundColor: mode === "light" ? "#f1f3f5" : "#2d3748",
          padding: "2px 6px",
          borderRadius: 4,
          fontSize: "0.9em",
          fontFamily: "monospace",
          color: mode === "light" ? "#e53e3e" : "#fc8181",
        },
        "& pre": {
          backgroundColor: mode === "light" ? "#f8f9fa" : "#1a202c",
          padding: "12px 16px",
          borderRadius: 8,
          overflow: "auto",
          margin: "0.75em 0",
          "& code": {
            backgroundColor: "transparent",
            padding: 0,
            color: theme.palette.text.primary,
          },
        },
        "& blockquote": {
          borderLeft: `3px solid ${theme.palette.primary.main}`,
          paddingLeft: "1em",
          margin: "0.75em 0",
          fontStyle: "italic",
          color: theme.palette.text.secondary,
        },
        "& a": {
          color: theme.palette.primary.main,
          textDecoration: "none",
          "&:hover": {
            textDecoration: "underline",
          },
        },
        "& table": {
          borderCollapse: "collapse",
          width: "100%",
          margin: "0.75em 0",
        },
        "& th, & td": {
          border: `1px solid ${theme.palette.divider}`,
          padding: "8px 12px",
          textAlign: "left",
        },
        "& th": {
          backgroundColor: mode === "light" ? "#f8f9fa" : "#2d3748",
          fontWeight: 600,
        },
        "& hr": {
          border: "none",
          borderTop: `1px solid ${theme.palette.divider}`,
          margin: "1em 0",
        },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </Box>
  );
};

