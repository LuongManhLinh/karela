"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Container,
  Paper,
  Button,
  Typography,
  Box,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from "@mui/material";
import {
  Logout,
  Article,
  Settings,
  Brightness4,
  Brightness7,
} from "@mui/icons-material";
import { useTranslations, useLocale } from "next-intl";
import { Layout } from "@/components/Layout";
import {
  useConnectionQuery as useGetConnectionQuery,
  useProjectsSyncQuery,
} from "@/hooks/queries/useConnectionQueries";
import { useNotificationContext } from "@/providers/NotificationProvider";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import type { ProjectSyncDto } from "@/types/connection";
import { ConnectionItem } from "@/components/profile/ConnectionItem";
import { SyncProjectsDialog } from "@/components/profile/SyncProjectsDialog";
import { getThemeName, setThemeName } from "@/utils/themeStorageUtil";
import { getThemesAction } from "@/app/actions";
import { removeToken } from "@/utils/jwtUtils";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useThemeMode } from "@/providers/ThemeProvider";
import { setLanguage } from "@/utils/languageUtils";

type ThemeOption = {
  name: string;
  primary: string;
};

export default function ProfilePage() {
  const t = useTranslations("profile.ProfilePage");
  const tAppBar = useTranslations("MyAppBar");
  const locale = useLocale();

  const router = useRouter();

  const { data: connectionsData, isLoading: isConnectionsLoading } =
    useGetConnectionQuery();

  const connection = useMemo(
    () => connectionsData?.data || null,
    [connectionsData],
  );

  const { notify } = useNotificationContext();
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [selectedThemeName, setSelectedThemeName] = useState(getThemeName());

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const { data, isLoading } = useProjectsSyncQuery();
  const syncStatuses: ProjectSyncDto[] = useMemo(() => {
    return data?.data || [];
  }, [data]);

  const syncedProjectsCount = useMemo(
    () => syncStatuses.filter((project) => project.synced).length,
    [syncStatuses],
  );

  const { resetAll } = useWorkspaceStore();

  const totalProjectsCount = syncStatuses.length;
  const { mode, toggleColorMode } = useThemeMode();

  const handleLanguageChange = (newLocale: string) => {
    setLanguage(newLocale);
    router.refresh();
  };

  // Show snackbar to alert to connect Jira if no connections exist
  useEffect(() => {
    if (!isConnectionsLoading && !connection) {
      notify(t("messages.connectJiraPrompt"), {
        severity: "info",
        duration: 10000,
      });
    }
  }, [isConnectionsLoading, connection, notify]);

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const themeOptions = await getThemesAction();
        setThemes(themeOptions);
      } catch {
        notify(t("messages.themeLoadFailed"), { severity: "error" });
      }
    };

    void loadThemes();
  }, [notify, t]);

  useEffect(() => {
    if (!isLoading && totalProjectsCount > 0 && syncedProjectsCount === 0) {
      notify(t("messages.syncProjectsToStart"), {
        severity: "info",
        duration: 10000,
      });
    }
  }, [isLoading, totalProjectsCount, syncedProjectsCount, notify, t]);

  const basePath = "/app";

  const handleSyncConnection = async () => {
    setSyncDialogOpen(true);
  };

  const handleThemeSelect = (themeName: string) => {
    setThemeName(themeName);
    setSelectedThemeName(themeName);
    notify(t("messages.themeUpdated"), { severity: "success" });
    router.refresh();
  };

  const handleLogout = () => {
    removeToken();
    resetAll();
    router.push("/login");
  };

  if (isConnectionsLoading) {
    return (
      <Layout>
        <LoadingSpinner fullScreen />
      </Layout>
    );
  }

  return (
    <Layout
      appBarLeftContent={
        <Stack direction={"row"} alignItems="center" spacing={2} py={2}>
          <Typography variant="h5">{t("title")}</Typography>
        </Stack>
      }
      appBarTransparent={true}
      basePath={basePath}
    >
      <Container
        maxWidth="md"
        sx={{
          p: 4,
          overflowY: "auto",
          flexGrow: 1,
        }}
      >
        <Paper
          elevation={4}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, flexGrow: 1 }}
            >
              {t("jiraConnections")}
            </Typography>
          </Box>
          <Stack spacing={2}>
            {connection ? (
              <ConnectionItem connection={connection} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t("connectJiraToStart")}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              onClick={handleSyncConnection}
              fullWidth
            >
              {t("syncWithCount", {
                synced: syncedProjectsCount,
                total: totalProjectsCount,
              })}
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={4}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: "background.paper",
            mb: 3,
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            {t("theme")}
          </Typography>

          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {tAppBar("changeTheme")}
              </Typography>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_e, newMode) => {
                  if (newMode && newMode !== mode) toggleColorMode();
                }}
                aria-label="theme mode"
              >
                <ToggleButton
                  value="light"
                  aria-label="light mode"
                  sx={{ px: 3 }}
                >
                  <Brightness7 sx={{ mr: 1 }} /> {t("light")}
                </ToggleButton>
                <ToggleButton
                  value="dark"
                  aria-label="dark mode"
                  sx={{ px: 3 }}
                >
                  <Brightness4 sx={{ mr: 1 }} /> {t("dark")}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t("chooseTheme")}
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                {themes.map((theme) => {
                  const isSelected = selectedThemeName === theme.name;
                  const size = isSelected ? 48 : 36;

                  return (
                    <IconButton
                      key={theme.name}
                      onClick={() => handleThemeSelect(theme.name)}
                      title={theme.name.replace(/\.json$/, "")}
                      sx={{
                        width: size,
                        height: size,
                        bgcolor: theme.primary,
                        color: isSelected ? "text.primary" : "transparent",
                        "&:hover": {
                          opacity: 0.75,
                          bgcolor: theme.primary,
                        },
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {tAppBar("language")}
              </Typography>
              <ToggleButtonGroup
                value={locale}
                exclusive
                onChange={(_e, newLocale) => {
                  if (newLocale) handleLanguageChange(newLocale);
                }}
                aria-label="language"
              >
                <ToggleButton
                  value="en"
                  aria-label="english"
                  sx={{ px: 3, fontWeight: 600 }}
                >
                  EN
                </ToggleButton>
                <ToggleButton
                  value="vi"
                  aria-label="vietnamese"
                  sx={{ px: 3, fontWeight: 600 }}
                >
                  VI
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Stack>
        </Paper>

        <Paper
          elevation={4}
          sx={{
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => router.push("/documentation")}
              fullWidth
              startIcon={<Article />}
            >
              {t("documentation")}
            </Button>
            <Button
              variant="contained"
              onClick={() => router.push("/preferences")}
              fullWidth
              startIcon={<Settings />}
            >
              {t("preferences")}
            </Button>
            <Button
              variant="contained"
              onClick={() => setLogoutDialogOpen(true)}
              fullWidth
              startIcon={<Logout />}
            >
              {t("logout")}
            </Button>
          </Box>
        </Paper>
      </Container>

      <SyncProjectsDialog
        open={syncDialogOpen}
        isLoading={isLoading}
        syncStatuses={syncStatuses}
        syncedProjectsCount={syncedProjectsCount}
        totalProjectsCount={totalProjectsCount}
        onClose={() => setSyncDialogOpen(false)}
      />

      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
      >
        <DialogTitle>{t("confirmLogout")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t("areYouSureYouWantToLogout")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => setLogoutDialogOpen(false)}
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleLogout} variant="outlined">
            {t("logout")}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
