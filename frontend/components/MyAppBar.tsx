"use client";

import React, { useMemo, useState } from "react";
import {
  IconButton,
  Box,
  Button,
  Stack,
  Paper,
  useTheme,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Menu,
} from "@mui/material";
import {
  Brightness4,
  Brightness7,
  Logout,
  Assistant,
  Analytics,
  EmojiObjects,
  ManageAccounts,
  Article,
  Code,
  Segment,
} from "@mui/icons-material";
import { useThemeMode } from "./ThemeProvider";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { removeToken } from "@/utils/jwtUtils";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export interface Route {
  name: string;
  href: string;
  icon: React.ReactNode;
}
export interface AppBarProps {
  routes?: Route[];
  basePath?: string;
  leftContent?: React.ReactNode;
  transparent?: boolean;
}

export const getDefaultRoutes = (): Route[] => {
  return [
    { name: "Analysis", href: `/analyses`, icon: <Analytics /> },
    { name: "Chat", href: `/chats`, icon: <Assistant /> },
    {
      name: "Proposals",
      href: `/proposals`,
      icon: <EmojiObjects />,
    },
    { name: "AC", href: `/acs`, icon: <Code /> },
    {
      name: "Documentation",
      href: `/documentation`,
      icon: <Article />,
    },
  ];
};

export const MyAppBar: React.FC<AppBarProps> = ({
  routes,
  basePath,
  leftContent,
  transparent = false,
}) => {
  const { mode, toggleColorMode } = useThemeMode();
  const router = useRouter();
  const theme = useTheme();

  const internalRoutes = useMemo(() => {
    if (routes) return routes;
    if (basePath) return getDefaultRoutes();
    return [];
  }, [routes, basePath]);

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  const pathname = usePathname();

  const { resetHeaderKeys } = useWorkspaceStore();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (menuOpen) {
      setMenuOpen(false);
    } else {
      setMenuAnchorEl(event.currentTarget);
      setMenuOpen(true);
    }
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

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
      <Box
        sx={{
          px: 2,
          gap: 2,
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ flexGrow: 1 }}>{leftContent}</Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {internalRoutes.map((page) => (
            <Button
              color="inherit"
              size="small"
              component={Link}
              href={`${basePath || ""}${page.href}`}
              key={page.name}
              startIcon={page.icon}
              onClick={resetHeaderKeys}
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

          <IconButton onClick={handleMenuOpen} color="inherit">
            <Segment />
          </IconButton>

          <Menu
            anchorEl={menuAnchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            slotProps={{
              root: {
                sx: { pointerEvents: "none" },
              },
              paper: {
                sx: {
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  pointerEvents: "auto",
                },
              },
            }}
            hideBackdrop={true}
            disableEnforceFocus={true}
            disableScrollLock={true}
          >
            <MenuItem
              onClick={resetHeaderKeys}
              href="/profile"
              component={Link}
            >
              <ListItemIcon>
                <ManageAccounts />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={toggleColorMode}>
              <ListItemIcon>
                {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
              </ListItemIcon>
              <ListItemText>Change Theme</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Box>
  );
};
