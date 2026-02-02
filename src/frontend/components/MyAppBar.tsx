"use client";

import React, { useMemo, useState } from "react";
import {
  IconButton,
  Box,
  Button,
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
  Language,
} from "@mui/icons-material";
import { useThemeMode } from "../providers/ThemeProvider";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { removeToken } from "@/utils/jwtUtils";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useTranslations } from "next-intl";

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

export const MyAppBar: React.FC<AppBarProps> = ({
  routes,
  basePath,
  leftContent,
  transparent = false,
}) => {
  const t = useTranslations("MyAppBar");
  const { mode, toggleColorMode } = useThemeMode();
  const router = useRouter();
  const theme = useTheme();

  const internalRoutes = useMemo(() => {
    if (routes) return routes;
    if (basePath)
      return [
        { name: t("analysis"), href: `/analyses`, icon: <Analytics /> },
        { name: t("chat"), href: `/chats`, icon: <Assistant /> },
        {
          name: t("proposals"),
          href: `/proposals`,
          icon: <EmojiObjects />,
        },
        { name: t("ac"), href: `/acs`, icon: <Code /> },
        {
          name: t("documentation"),
          href: `/documentation`,
          icon: <Article />,
        },
      ];
    return [];
  }, [routes, basePath, t]);

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  const handleLanguageChange = (locale: string) => {
    setLanguageMenuOpen(false);
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  };

  const pathname = usePathname();

  const { resetHeaderKeys } = useWorkspaceStore();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const [languageMenuAnchorEl, setLanguageMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [languageMenuOpen, setLanguageMenuOpen] = useState<boolean>(false);

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
    setMenuOpen(false);
  };

  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageMenuAnchorEl(event.currentTarget);
    setLanguageMenuOpen(true);
  };

  const handleLanguageMenuClose = () => {
    setLanguageMenuAnchorEl(null);
    setLanguageMenuOpen(false);
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
              <ListItemText>{t("profile")}</ListItemText>
            </MenuItem>
            <MenuItem onClick={toggleColorMode}>
              <ListItemIcon>
                {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
              </ListItemIcon>
              <ListItemText>{t("changeTheme")}</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLanguageMenuOpen}>
              <ListItemIcon>
                <Language />
              </ListItemIcon>
              <ListItemText>{t("language")}</ListItemText>
            </MenuItem>

            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText>{t("logout")}</ListItemText>
            </MenuItem>
          </Menu>
          <Menu
            anchorEl={languageMenuAnchorEl}
            open={languageMenuOpen}
            onClose={handleLanguageMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <MenuItem onClick={() => handleLanguageChange("en")}>
              <ListItemIcon>
                <Language />
              </ListItemIcon>
              <ListItemText>English</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleLanguageChange("vi")}>
              <ListItemIcon>
                <Language />
              </ListItemIcon>
              <ListItemText>Tiếng Việt</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Box>
  );
};
