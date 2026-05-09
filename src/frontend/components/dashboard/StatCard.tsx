"use client";

import React from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import Link from "next/link";

export interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  href,
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={2}
      component={Link}
      href={href}
      sx={{
        p: 2,
        borderRadius: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 140,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        // bgcolor: "secondaryContainer",
        // color: "onSecondaryContainer",
        bgcolor: "primaryContainer",
        color: "onPrimaryContainer",
        textDecoration: "none",
        "&:hover": {
          boxShadow: 5,
          transform: "translateY(-2px)",
        },
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
