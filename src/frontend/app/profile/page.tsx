"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Stack,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { Layout } from "@/components/Layout";
import {
  useCurrentUserQuery,
  useChangePasswordMutation,
} from "@/hooks/queries/useUserQueries";
import { useUserConnectionsQuery } from "@/hooks/queries/useConnectionQueries";
import { jiraService } from "@/services/jiraService";
import { AppSnackbar } from "@/components/AppSnackbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import type { ConnectionDto } from "@/types/connection";
import { Add, Edit, Delete } from "@mui/icons-material";
import { ConnectionItem } from "@/components/profile/ConnectionItem";
import { connectionService } from "@/services/connectionService";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export default function ProfilePage() {
  const t = useTranslations("profile.ProfilePage");
  const {
    selectedConnection: selectedConnection,
    setSelectedConnection: setSelectedConnection,
    setConnections: setConnections,
    selectedProject: selectedProject,
    setSelectedProject: setSelectedProject,
    setProjects: setProjects,
    setSelectedStory: setSelectedStory,
    setStories: setStories,
  } = useWorkspaceStore();
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);
  const menuOpen = Boolean(menuAnchorEl);

  const { data: userData, isLoading: isUserLoading } = useCurrentUserQuery();
  const {
    data: connectionsData,
    isLoading: isConnectionsLoading,
    refetch: refetchConnections,
  } = useUserConnectionsQuery();

  const { mutateAsync: changePassword, isPending: isChangingPassword } =
    useChangePasswordMutation();

  const user = useMemo(() => userData?.data || null, [userData]);
  const connections = useMemo(
    () => connectionsData?.data || [],
    [connectionsData],
  );
  const loading = isUserLoading || isConnectionsLoading;
  const [connectingJira, setConnectingJira] = useState(false);

  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [severity, setSeverity] = useState<"error" | "success" | "info">(
    "info",
  );
  const [showSnackbar, setShowSnackbar] = useState(false);

  // Show snackbar to alert to connect Jira if no connections exist
  useEffect(() => {
    if (!loading && !isConnectionsLoading && connections.length === 0) {
      setSnackbarMessage(t("messages.connectJiraPrompt"));
      setSeverity("info");
      setShowSnackbar(true);
    }
  }, [loading, isConnectionsLoading, connections]);

  const basePath = useMemo(() => {
    if (!selectedConnection) {
      return "/app";
    }
    if (!selectedProject) {
      return `/app/connections/${selectedConnection.name}`;
    }

    return `/app/connections/${selectedConnection.name}/projects/${selectedProject.key}`;
  }, [selectedConnection, selectedProject]);

  // Load user data handles via React Query hooks automatically

  const handleMenuOpen = async (
    event: React.MouseEvent<HTMLElement>,
    connectionId: string,
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedConnectionId(connectionId);
  };

  const handleMenuClose = async () => {
    setMenuAnchorEl(null);
    setSelectedConnectionId(null);
  };

  const handleUpdateConnection = async () => {
    handleMenuClose();
    await handleConnectJira();
  };

  const handleDeleteConnection = async () => {
    connectionService.deleteConnection(selectedConnectionId!).then(() => {
      // Optionally, you can refetch the connections or update the state to reflect the deletion
      refetchConnections().then((res) => {
        setSelectedConnection(null);
        setConnections(res.data?.data || []);
        setSelectedProject(null);
        setProjects([]);
        setSelectedStory(null);
        setStories([]);
      });
    });
    handleMenuClose();
  };

  const handleConnectJira = async () => {
    setConnectingJira(true);
    setSnackbarMessage("");

    try {
      await jiraService.startOAuth();
      // The redirect will happen in jiraService, so we don't need to do anything here
    } catch (err: any) {
      const errorMessage = err.message || t("messages.initiateFailed");
      setSnackbarMessage(errorMessage);
      setShowSnackbar(true);
      setSeverity("error");
    } finally {
      setConnectingJira(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSnackbarMessage("");

    if (newPassword !== confirmPassword) {
      setSnackbarMessage(t("messages.passwordsDoNotMatch"));
      setShowSnackbar(true);
      setSeverity("error");
      return;
    }

    if (newPassword.length < 6) {
      setSnackbarMessage(t("messages.passwordTooShort"));
      setSeverity("error");
      setShowSnackbar(true);
      return;
    }

    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setSnackbarMessage(t("messages.passwordChanged"));
      setShowSnackbar(true);
      setSeverity("success");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || t("messages.changePasswordFailed");
      setSnackbarMessage(errorMessage);
      setSeverity("error");
      setShowSnackbar(true);
    }
  };

  if (loading) {
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
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, overflowY: "auto" }}>
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 1,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            {t("userInformation")}
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label={t("username")}
              value={user?.username || ""}
              disabled
            />
            <TextField
              fullWidth
              label={t("email")}
              value={user?.email || ""}
              disabled
            />
          </Stack>
        </Paper>

        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 1,
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
            {connections && connections.length > 0 ? (
              connections.map((conn: ConnectionDto) => (
                <ConnectionItem
                  key={conn.id}
                  connection={conn}
                  onMenuOpen={handleMenuOpen}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t("connectJiraToStart")}
              </Typography>
            )}
            <Button
              variant="contained"
              startIcon={connectingJira ? undefined : <Add />}
              onClick={handleConnectJira}
              disabled={connectingJira}
              fullWidth
            >
              {connectingJira ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} />
                  <span>{t("connecting")}</span>
                </Box>
              ) : (
                t("connectJiraButton")
              )}
            </Button>
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
                paper: {
                  sx: {
                    bgcolor: "background.default",
                  },
                },
              }}
            >
              <MenuItem onClick={handleUpdateConnection}>
                <ListItemIcon>
                  <Edit fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t("update")}</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleDeleteConnection}>
                <ListItemIcon>
                  <Delete fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t("delete")}</ListItemText>
              </MenuItem>
            </Menu>
          </Stack>
        </Paper>

        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 1,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            {t("changePassword")}
          </Typography>
          <Box component="form" onSubmit={handleChangePassword}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                required
                name="oldPassword"
                label={t("currentPassword")}
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={isChangingPassword}
              />
              <TextField
                fullWidth
                required
                name="newPassword"
                label={t("newPassword")}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChangingPassword}
              />
              <TextField
                fullWidth
                required
                name="confirmPassword"
                label={t("confirmNewPassword")}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isChangingPassword}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <LoadingSpinner size={24} />
                ) : (
                  t("changePassword")
                )}
              </Button>
            </Stack>
          </Box>
        </Paper>

        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 1,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            {t("settings")}
          </Typography>
          <Box sx={{ width: "100%" }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isChangingPassword}
              onClick={() => router.push("/settings")}
              fullWidth
            >
              {t("editSettings")}
            </Button>
          </Box>
        </Paper>
      </Container>
      <AppSnackbar
        open={showSnackbar}
        message={snackbarMessage}
        severity={severity}
        onClose={() => setShowSnackbar(false)}
      />
    </Layout>
  );
}
