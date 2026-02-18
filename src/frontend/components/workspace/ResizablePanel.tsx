"use client";

import React from "react";
import { Box, IconButton, Typography, Paper, Tooltip } from "@mui/material";
import { Close, OpenInFull, CloseFullscreen } from "@mui/icons-material";
import { scrollBarSx } from "@/constants/scrollBarSx";

export interface PanelConfig {
  id: string;
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  defaultHeight?: number;
  minHeight?: number;
}

interface ResizablePanelProps {
  config: PanelConfig;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  /** When provided the panel renders at this fixed pixel height */
  height?: number;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  config,
  children,
  isOpen,
  onClose,
  isMaximized = false,
  onToggleMaximize,
  height,
}) => {
  if (!isOpen) return null;

  return (
    <Paper
      elevation={2}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: isMaximized ? "100%" : (height ?? "100%"),
        minHeight: config.minHeight || 100,
        borderRadius: 1,
        overflow: "hidden",
        flexShrink: 0,
        flexGrow: isMaximized ? 1 : undefined,
      }}
    >
      {/* Panel Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 0.75,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "tertiaryContainer",
          cursor: "default",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {config.icon}
          <Typography variant="subtitle2" fontWeight={600}>
            {config.title}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {onToggleMaximize && (
            <Tooltip title={isMaximized ? "Restore" : "Maximize"}>
              <IconButton size="small" onClick={onToggleMaximize}>
                {isMaximized ? (
                  <CloseFullscreen fontSize="small" />
                ) : (
                  <OpenInFull fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Close">
            <IconButton size="small" onClick={onClose}>
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Panel Content */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: 2,
          ...scrollBarSx,
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};

export default ResizablePanel;
