"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from "@mui/material";
import { Layout } from "@/components/Layout";
import {
  useCurrentUserQuery,
  useChangePasswordMutation,
} from "@/hooks/queries/useUserQueries";
import { useUserConnectionsQuery } from "@/hooks/queries/useConnectionQueries";
import { jiraService } from "@/services/jiraService";
import { ErrorSnackbar } from "@/components/ErrorSnackbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import type { ConnectionDto } from "@/types/connection";
import { Add, Edit, Delete } from "@mui/icons-material";
import { JiraConnectionItem } from "@/components/profile/JiraConnectionItem";
import { connectionService } from "@/services/connectionService";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export default function ProfilePage() {
  const {
    selectedConnection,
    setSelectedConnection,
    setConnections,
    selectedProject,
    setSelectedProject,
    setProjects,
    setSelectedStory,
    setStories,
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

  const user = userData?.data;
  const connections = connectionsData?.data;
  const loading = isUserLoading || isConnectionsLoading;
  const [connectingJira, setConnectingJira] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    connectionId: string,
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedConnectionId(connectionId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedConnectionId(null);
  };

  const handleUpdateConnection = () => {
    console.log("Update connection:", selectedConnectionId);
    handleMenuClose();
  };

  const handleDeleteConnection = () => {
    connectionService.deleteConnection(selectedConnectionId!).then(() => {
      // Optionally, you can refetch the connections or update the state to reflect the deletion
      refetchConnections().then((res) => {
        setSelectedConnection(null);
        setConnections(res.data?.data?.jira_connections || []);
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
    setError("");

    try {
      await jiraService.startOAuth();
      // The redirect will happen in jiraService, so we don't need to do anything here
    } catch (err: any) {
      const errorMessage = err.message || "Failed to initiate Jira connection";
      setError(errorMessage);
      setShowError(true);
    } finally {
      setConnectingJira(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setShowError(true);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setShowError(true);
      return;
    }

    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setSuccess("Password changed successfully");
      setShowSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to change password";
      setError(errorMessage);
      setShowError(true);
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
          <Typography variant="h5">Profile</Typography>
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
            User Information
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Username"
              value={user?.username || ""}
              disabled
            />
            <TextField
              fullWidth
              label="Email"
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
              Jira Connections
            </Typography>
          </Box>
          <Stack spacing={2}>
            {connections && connections.jira_connections.length > 0 ? (
              connections.jira_connections.map((conn: ConnectionDto) => (
                <JiraConnectionItem
                  key={conn.id}
                  connection={conn}
                  onMenuOpen={handleMenuOpen}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Connect your Jira account to get started.
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
                  <span>Connecting...</span>
                </Box>
              ) : (
                "Connect Jira Account"
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
                <ListItemText>Update</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleDeleteConnection}>
                <ListItemIcon>
                  <Delete fontSize="small" />
                </ListItemIcon>
                <ListItemText>Delete</ListItemText>
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
            Change Password
          </Typography>
          <Box component="form" onSubmit={handleChangePassword}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                required
                name="oldPassword"
                label="Current Password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={isChangingPassword}
              />
              <TextField
                fullWidth
                required
                name="newPassword"
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChangingPassword}
              />
              <TextField
                fullWidth
                required
                name="confirmPassword"
                label="Confirm New Password"
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
                  "Change Password"
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
            Settings
          </Typography>
          <Box sx={{ width: "100%" }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isChangingPassword}
              onClick={() => router.push("/settings")}
              fullWidth
            >
              Edit Settings
            </Button>
          </Box>
        </Paper>

        {showSuccess && (
          <Alert
            severity="success"
            sx={{ mt: 2 }}
            onClose={() => setShowSuccess(false)}
          >
            {success}
          </Alert>
        )}
      </Container>
      <ErrorSnackbar
        open={showError}
        message={error}
        onClose={() => setShowError(false)}
      />
    </Layout>
  );
}
