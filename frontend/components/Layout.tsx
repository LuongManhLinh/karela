"use client";

import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Stack,
  Icon,
  Paper,
  useTheme,
} from "@mui/material";
import { Brightness4, Brightness7, Logout } from "@mui/icons-material";
import { useThemeMode } from "./ThemeProvider";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export const MyAppBar: React.FC<{
  leftContent?: React.ReactNode;
  transparent?: boolean;
}> = ({ leftContent, transparent = false }) => {
  const { mode, toggleColorMode } = useThemeMode();
  const router = useRouter();
  const theme = useTheme();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const pathname = usePathname();

  const pages = [
    { name: "Chat", href: "/chat" },
    { name: "Analyze", href: "/analysis" },
    { name: "Proposals", href: "/proposals" },
    { name: "Profile", href: "/profile" },
  ];
  return (
    <Box
      sx={{
        background: transparent
          ? "transparent"
          : theme.palette.mode === "dark"
          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          : "linear-gradient(135deg,rgb(202, 144, 235) 0%,rgb(197, 217, 245) 100%)",
        borderRadius: 0,
        width: "100%",
      }}
    >
      <Stack direction={"row"} alignItems="center" sx={{ px: 2, gap: 2 }}>
        <Box sx={{ flexGrow: 1 }}>{leftContent}</Box>

        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
          {pages.map((page) => (
            <Button
              color="inherit"
              component={Link}
              href={page.href}
              key={page.name}
              sx={{
                borderRadius: 2,
                px: 2,
                textDecoration: pathname === page.href ? "underline" : "none",
              }}
            >
              {page.name}
            </Button>
          ))}

          <IconButton
            color="inherit"
            onClick={toggleColorMode}
            sx={{
              borderRadius: 2,
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          <IconButton
            color="inherit"
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <Logout />
          </IconButton>
        </Box>
      </Stack>
    </Box>
  );
};

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
