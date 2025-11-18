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
} from "@mui/material";
import { Brightness4, Brightness7, Logout } from "@mui/icons-material";
import { useThemeMode } from "./ThemeProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { mode, toggleColorMode } = useThemeMode();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar
        position="static"
        // Change background using the
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          boxShadow: "0 4px 16px rgba(102, 126, 234, 0.3)",
          borderRadius: 0,
        }}
      >
        <Toolbar>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexGrow: 1 }}
          >
            <Box
              component="img"
              sx={{
                height: 32,
                width: 32,
              }}
              alt="Icon"
              src="/ratsnake-icon.svg"
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              <Link
                href="/chat"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                Ratsnake
              </Link>
            </Typography>
          </Stack>
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            <Button
              color="inherit"
              component={Link}
              href="/chat"
              sx={{
                borderRadius: 2,
                px: 2,
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              Chat
            </Button>
            <Button
              color="inherit"
              component={Link}
              href="/analyze"
              sx={{
                borderRadius: 2,
                px: 2,
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              Analyze
            </Button>
            <Button
              color="inherit"
              component={Link}
              href="/profile"
              sx={{
                borderRadius: 2,
                px: 2,
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              Profile
            </Button>
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
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default" }}>
        {children}
      </Box>
    </Box>
  );
};
