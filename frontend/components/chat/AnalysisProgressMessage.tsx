"use client";

import React, { useEffect, useState } from "react";
import { Box, LinearProgress, Typography, Chip, useTheme } from "@mui/material";
import { Analytics } from "@mui/icons-material";
import { defectService } from "@/services/defectService";
import type { ChatMessageDto, AnalysisProgressMessageContent } from "@/types";

interface AnalysisProgressMessageProps {
  message: ChatMessageDto;
}

export const AnalysisProgressMessage: React.FC<AnalysisProgressMessageProps> = ({
  message,
}) => {
  const theme = useTheme();
  const content = message.content as AnalysisProgressMessageContent;
  const [status, setStatus] = useState(content.status);
  const [polling, setPolling] = useState(
    content.status === "PENDING" || content.status === "IN_PROGRESS"
  );

  useEffect(() => {
    if (!polling) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await defectService.getAnalysisStatus(content.analysis_id);
        if (response.data) {
          const newStatus = response.data.status;
          setStatus(newStatus);

          if (newStatus === "COMPLETED" || newStatus === "FAILED") {
            setPolling(false);
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error("Failed to poll analysis status:", err);
        setPolling(false);
        clearInterval(pollInterval);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [polling, content.analysis_id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "IN_PROGRESS":
        return "info";
      case "FAILED":
        return "error";
      case "PENDING":
        return "warning";
      default:
        return "default";
    }
  };

  const isInProgress = status === "PENDING" || status === "IN_PROGRESS";

  return (
    <Box
      sx={{
        my: 3,
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 3,
          maxWidth: "85%",
          width: "100%",
          bgcolor: "background.paper",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: theme.palette.mode === "light" ? "#f0f4ff" : "#2d3748",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Analytics
              sx={{
                color: theme.palette.primary.main,
                fontSize: 28,
              }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Analysis Progress
            </Typography>
            <Chip
              label={status}
              size="small"
              color={getStatusColor(status)}
              sx={{ borderRadius: 1.5 }}
            />
          </Box>
        </Box>
        {isInProgress && (
          <LinearProgress
            sx={{
              mt: 2,
              mb: 2,
              height: 6,
              borderRadius: 3,
              bgcolor: theme.palette.mode === "light" ? "#f1f3f5" : "#1a202c",
            }}
          />
        )}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            fontFamily: "monospace",
            bgcolor: theme.palette.mode === "light" ? "#f8f9fa" : "#1a202c",
            p: 1,
            borderRadius: 1,
            mt: 1,
          }}
        >
          ID: {content.analysis_id}
        </Typography>
      </Paper>
    </Box>
  );
}

