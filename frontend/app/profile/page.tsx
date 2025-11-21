"use client";

import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { Layout } from "@/components/Layout";
import { userService } from "@/services/userService";
import { jiraService } from "@/services/jiraService";
import { ErrorSnackbar } from "@/components/ErrorSnackbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import type { UserDto, UserConnections, JiraConnectionDto } from "@/types";
import { Add, Link as LinkIcon } from "@mui/icons-material";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserDto | null>(null);
  const [connections, setConnections] = useState<UserConnections | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [connectingJira, setConnectingJira] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    loadUser();
  }, [router]);

  const loadUser = async () => {
    try {
      const [userResponse, connectionsResponse] = await Promise.all([
        userService.getCurrentUser(),
        userService.getUserConnections(),
      ]);

      if (userResponse.data) {
        setUser(userResponse.data);
      }

      if (connectionsResponse.data) {
        setConnections(connectionsResponse.data);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
      } else {
        setError("Failed to load user information");
        setShowError(true);
      }
    } finally {
      setLoading(false);
    }
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

    setChangingPassword(true);

    try {
      await userService.changePassword({
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
    } finally {
      setChangingPassword(false);
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
        <Stack direction={"row"} alignItems="center" spacing={2}>
          <Typography variant="h5" fontWeight="bold">
            Profile
          </Typography>
        </Stack>
      }
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
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Jira Connections
          </Typography>
          <Stack spacing={2}>
            {connections && connections.jira_connections.length > 0 ? (
              connections.jira_connections.map((conn: JiraConnectionDto) => (
                <Paper
                  key={conn.id}
                  elevation={1}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    transition: "all 0.2s",
                    "&:hover": {
                      elevation: 2,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  {conn.avatar_url && (
                    <Box
                      component="img"
                      src={conn.avatar_url}
                      alt={conn.name || "Jira"}
                      sx={{ width: 40, height: 40, borderRadius: 1 }}
                    />
                  )}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {conn.name || "Jira Connection"}
                    </Typography>
                    {conn.url && (
                      <Typography variant="caption" color="text.secondary">
                        {conn.url}
                      </Typography>
                    )}
                  </Box>
                  <LinkIcon color="action" />
                </Paper>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" paragraph>
                No Jira connections found. Connect your Jira account to get
                started.
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
                disabled={changingPassword}
              />
              <TextField
                fullWidth
                required
                name="newPassword"
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={changingPassword}
              />
              <TextField
                fullWidth
                required
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={changingPassword}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={changingPassword}
              >
                {changingPassword ? (
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
              disabled={changingPassword}
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
