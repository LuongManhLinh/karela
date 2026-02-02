"use client";

import React from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";

export interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  onClick,
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={2}
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 140,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease-in-out",
        bgcolor: "tertiaryContainer",
        color: "onTertiaryContainer",
        "&:hover": onClick
          ? {
              transform: "translateY(-2px)",
              boxShadow: theme.shadows[4],
              bgcolor: "onTertiaryFixed",
              color: "tertiaryFixed",
            }
          : {},
      }}
    >
      <Box
        sx={{
          mb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Typography variant="h4" fontWeight="bold">
        {value}
      </Typography>
      <Typography variant="body2" textAlign="center">
        {title}
      </Typography>
    </Paper>
  );
};
