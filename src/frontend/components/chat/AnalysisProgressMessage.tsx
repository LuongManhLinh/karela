"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  LinearProgress,
  Typography,
  Chip,
  Paper,
  useTheme,
  Button,
  Stack,
} from "@mui/material";
import { Analytics } from "@mui/icons-material";
import { analysisService } from "@/services/analysisService";
import type { ChatMessageDto } from "@/types/chat";

interface AnalysisProgressMessageProps {
  message: ChatMessageDto;
}

export const AnalysisProgressMessage: React.FC<
  AnalysisProgressMessageProps
> = ({ message }) => {
  const theme = useTheme();

  const analysisId = message.content;

  const [status, setStatus] = useState("");
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    analysisService.getAnalysisStatus(analysisId).then((response) => {
      if (response.data) {
        console.log("Status response:", response.data);
        setStatus(response.data || "");
        if (response.data === "PENDING" || response.data === "IN_PROGRESS") {
          setPolling(true);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!polling) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await analysisService.getAnalysisStatus(analysisId);
        if (response.data) {
          const newStatus = response.data;
          setStatus(newStatus);

          if (newStatus === "DONE" || newStatus === "FAILED") {
            setPolling(false);
            clearInterval(pollInterval);
          }
        } else {
          setPolling(false);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error("Failed to poll analysis status:", err);
        setPolling(false);
        clearInterval(pollInterval);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [polling, analysisId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DONE":
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
        display: "flex",
        justifyContent: "center",
        width: "100%",
        mb: 2,
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 1,
          width: "100%",
          bgcolor: "background.paper",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              p: 0.75,
              borderRadius: 2,
              bgcolor: theme.palette.mode === "light" ? "#e0e7ff" : "#2d3748",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Analytics
              sx={{
                fontSize: 28,
              }}
            />
          </Box>
          <Stack direction={"row"} alignItems="center" spacing={2}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Analysis Progress
            </Typography>
            <Chip
              label={status}
              size="small"
              color={getStatusColor(status)}
              sx={{ borderRadius: 1.5 }}
            />
          </Stack>
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
          ID: {analysisId}
        </Typography>
      </Paper>
    </Box>
  );
};
