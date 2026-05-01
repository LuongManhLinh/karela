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
  Assistant,
  Analytics,
  EmojiObjects,
  ManageAccounts,
  Article,
  Code,
  Segment,
  Workspaces,
  Settings,
  Close,
  Dashboard,
} from "@mui/icons-material";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
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
  const router = useRouter();
  const theme = useTheme();

  const internalRoutes = useMemo(() => {
    if (routes) return routes;
    if (basePath)
      return [
        { name: t("dashboard"), href: `/dashboard`, icon: <Dashboard /> },
        { name: t("analysis"), href: `/analyses`, icon: <Analytics /> },
        { name: t("chat"), href: `/chats`, icon: <Assistant /> },
        {
          name: t("proposals"),
          href: `/proposals`,
          icon: <EmojiObjects />,
        },
        { name: t("ac"), href: `/acs`, icon: <Code /> },
        {
          name: "Workspace",
          href: `/workspace`,
          icon: <Workspaces />,
        },
      ];
    return [];
  }, [routes, basePath, t]);

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
    setMenuOpen(false);
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
          {internalRoutes.map(
            (page) => (
              // menuOpen ? (
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
                  // color: "primary",
                }}
              >
                {page.name}
              </Button>
            ),
            //   ) : (
            //     <IconButton
            //       color="inherit"
            //       component={Link}
            //       href={`${basePath || ""}${page.href}`}
            //       key={page.name}
            //       onClick={resetHeaderKeys}
            //       title={page.name}
            //       sx={{
            //         bgcolor: pathname.includes(page.href)
            //           ? "action.selected"
            //           : "transparent",
            //         // color: "primary",
            //       }}
            //     >
            //       {page.icon}
            //     </IconButton>
            //   ),
          )}

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
            // slotProps={{
            //   root: {
            //     sx: { pointerEvents: "none" },
            //   },
            //   paper: {
            //     sx: {
            //       borderRadius: 1,
            //       bgcolor: "background.paper",
            //       pointerEvents: "auto",
            //     },
            //   },
            // }}
            // hideBackdrop={true}
            // disableEnforceFocus={true}
            // disableScrollLock={true}
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
            <MenuItem href="/documentation" component={Link}>
              <ListItemIcon>
                <Article />
              </ListItemIcon>
              <ListItemText>{t("documentation")}</ListItemText>
            </MenuItem>
            <MenuItem href="/preferences" component={Link}>
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText>{t("preferences")}</ListItemText>
            </MenuItem>
            {/* Button to close */}
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Close />
              </ListItemIcon>
              <ListItemText>{t("close")}</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Box>
  );
};
