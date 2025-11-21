"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

interface CollapsibleMessageProps {
  title: string;
  content: string | object;
  icon?: React.ReactNode;
}

export const CollapsibleMessage: React.FC<CollapsibleMessageProps> = ({
  title,
  content,
  icon,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const displayContent =
    typeof content === "string" ? content : JSON.stringify(content, null, 2);

  return (
    <Box sx={{ my: 2, width: "100%" }}>
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded(!expanded)}
        sx={{
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          "&:before": {
            display: "none",
          },
          bgcolor: theme.palette.background.paper,
        }}
      >
        <AccordionSummary
          expandIcon={
            <ExpandMore
              sx={{
                color: theme.palette.primary.main,
              }}
            />
          }
          sx={{
            borderRadius: expanded ? "8px 8px 0 0" : "8px",
            "&:hover": {
              bgcolor: theme.palette.mode === "light" ? "#f1f3f5" : "#2d3748",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {icon && (
              <Box
                sx={{
                  p: 0.75,
                  borderRadius: 1.5,
                  bgcolor:
                    theme.palette.mode === "light" ? "#e0e7ff" : "#2d3748",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {icon}
              </Box>
            )}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              {title}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 2 }}>
          <Box
            component="pre"
            sx={{
              fontFamily: "monospace",
              fontSize: "0.875rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              bgcolor: theme.palette.mode === "light" ? "#ffffff" : "#2d3748",
              p: 2,
              borderRadius: 2,
              overflow: "auto",
              maxHeight: "400px",
              margin: 0,
              color: theme.palette.text.primary,
              boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.06)",
            }}
          >
            {displayContent}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
