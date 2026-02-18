"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { Box, IconButton, Paper, useTheme } from "@mui/material";
import { Menu, FilterAltOutlined as Filter } from "@mui/icons-material";
import { MyAppBar } from "./MyAppBar";
import { scrollBarSx } from "@/constants/scrollBarSx";

interface LayoutProps {
  children: React.ReactNode;
  appBarLeftContent?: React.ReactNode;
  appBarTransparent?: boolean;
  basePath?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  appBarLeftContent,
  appBarTransparent,
  basePath,
}) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <MyAppBar
        leftContent={appBarLeftContent}
        transparent={appBarTransparent}
        basePath={basePath}
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
  basePath?: string;
  onFilterClick?: () => void;
}
export const DoubleLayout: React.FC<DoubleLayoutProps> = ({
  leftChildren,
  rightChildren,
  appBarLeftContent,
  appBarTransparent,
  basePath,
  onFilterClick,
}) => {
  const [menuOpen, setMenuOpen] = useState(true);
  const [collapsedWidth, setCollapsedWidth] = useState<number | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const theme = useTheme();

  const onMenuClick = () => {
    setMenuOpen(!menuOpen);
  };

  useLayoutEffect(() => {
    if (!menuButtonRef.current) {
      return;
    }

    const updateCollapsedWidth = () => {
      if (!menuButtonRef.current) {
        return;
      }
      const menuButtonWidth =
        menuButtonRef.current.getBoundingClientRect().width;
      const padding = parseFloat(theme.spacing(1)) * 2;
      setCollapsedWidth(Math.ceil(menuButtonWidth + padding));
    };

    updateCollapsedWidth();

    const observer = new ResizeObserver(updateCollapsedWidth);
    observer.observe(menuButtonRef.current);
    return () => {
      observer.disconnect();
    };
  }, [theme]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        maxHeight: "100vh",
        overflow: "hidden",
      }}
    >
      <Paper // Paper for left sidebar
        elevation={2}
        sx={{
          width: menuOpen
            ? "18vw"
            : collapsedWidth
              ? `${collapsedWidth}px`
              : "auto",
          height: "100vh",
          borderRadius: 0,
          flexShrink: 0,
          bgcolor: "background.paper",
          transition: "width 200ms ease",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: menuOpen ? "row" : "column",
            alignItems: "center",
            justifyContent: "space-between",
            px: 0.8,
          }}
        >
          <IconButton onClick={onMenuClick} ref={menuButtonRef}>
            <Menu />
          </IconButton>
          <IconButton onClick={onFilterClick}>
            <Filter />
          </IconButton>
        </Box>
        {menuOpen && leftChildren}
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
          basePath={basePath}
        />
        <Box
          sx={{
            flexGrow: 1,
            width: "100%",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {rightChildren}
        </Box>
      </Box>
    </Box>
  );
};
