"use client";

import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { StatCard, StatCardProps } from "./StatCard";

export interface StatsGridProps {
  stats: StatCardProps[];
  title?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, title }) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3 }}>
      {title && (
        <Typography
          variant="h6"
          fontWeight={600}
          color="text.primary"
          sx={{ mb: 2 }}
        >
          {title}
        </Typography>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(4, 1fr)",
            lg: "repeat(5, 1fr)",
          },
          gap: 2,
        }}
      >
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </Box>
    </Box>
  );
};
