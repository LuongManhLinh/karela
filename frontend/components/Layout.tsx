"use client";

import React from "react";
import { Box, Paper } from "@mui/material";
import { MyAppBar } from "./AppBar";

interface LayoutProps {
  children: React.ReactNode;
  appBarLeftContent?: React.ReactNode;
  appBarTransparent?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  appBarLeftContent,
  appBarTransparent,
}) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <MyAppBar
        leftContent={appBarLeftContent}
        transparent={appBarTransparent}
      />
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: "background.default", overflow: "auto" }}
      >
        {children}
      </Box>
    </Box>
  );
};

interface DoubleLayoutProps {
  leftChildren: React.ReactNode;
  rightChildren: React.ReactNode;
  appBarLeftContent?: React.ReactNode;
  appBarTransparent?: boolean;
}
export const DoubleLayout: React.FC<DoubleLayoutProps> = ({
  leftChildren,
  rightChildren,
  appBarLeftContent,
  appBarTransparent,
}) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "row", minHeight: "100vh" }}>
      <Paper
        elevation={2}
        sx={{
          width: "300px",
          height: "100vh",
          overflow: "auto",
          borderRadius: 0,
          flexShrink: 0,
          bgcolor: "background.paper",
          boxShadow: "2px 0 8px rgba(0, 0, 0, 0.08)",
        }}
      >
        {leftChildren}
      </Paper>
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <MyAppBar
          leftContent={appBarLeftContent}
          transparent={appBarTransparent}
        />
        <Box
          sx={{
            flexGrow: 1,
            width: "100%",
            maxHeight: "100%",
            overflow: "auto",
          }}
        >
          {rightChildren}
        </Box>
      </Box>
    </Box>
  );
};
