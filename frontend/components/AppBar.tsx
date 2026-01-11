"use client";

import React from "react";
import { IconButton, Box, Button, Stack, Paper, useTheme } from "@mui/material";
import {
  Brightness4,
  Brightness7,
  Logout,
  Assistant,
  Analytics,
  EmojiObjects,
  ManageAccounts,
  Settings,
  Code,
} from "@mui/icons-material";
import { useThemeMode } from "./ThemeProvider";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { removeToken } from "@/utils/jwt_utils";
const pages = [
  { name: "Analysis", href: "/analysis", icon: <Analytics /> },
  { name: "Chat", href: "/chat", icon: <Assistant /> },
  { name: "Proposals", href: "/proposals", icon: <EmojiObjects /> },
  { name: "Settings", href: "/settings", icon: <Settings /> },
  { name: "Profile", href: "/profile", icon: <ManageAccounts /> },
  { name: "AC Editor", href: "/gherkin-editor", icon: <Code /> },
];

export const MyAppBar: React.FC<{
  leftContent?: React.ReactNode;
  transparent?: boolean;
}> = ({ leftContent, transparent = false }) => {
  const { mode, toggleColorMode } = useThemeMode();
  const router = useRouter();
  const theme = useTheme();

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  const pathname = usePathname();

  return (
    <Box
      sx={{
        background: transparent
          ? "transparent"
          : theme.palette.background.paper,
        borderRadius: 0,
        width: "100%",
      }}
    >
      <Stack direction={"row"} alignItems="center" sx={{ px: 2, gap: 2 }}>
        <Box sx={{ flexGrow: 1 }}>{leftContent}</Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {pages.map((page) => (
            <Button
              color="inherit"
              size="small"
              component={Link}
              href={page.href}
              key={page.name}
              startIcon={page.icon}
              sx={{
                px: 1,
                py: 0.4,
                bgcolor: pathname.includes(page.href)
                  ? "action.selected"
                  : "transparent",
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
