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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { Layout } from "@/components/Layout";
import { settingsService } from "@/services/settingsService";
import { userService } from "@/services/userService";
import { ErrorSnackbar } from "@/components/ErrorSnackbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import type {
  SettingsDto,
  CreateSettingsRequest,
  UpdateSettingsRequest,
  JiraConnectionDto,
} from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<JiraConnectionDto[]>([]);
  const [connectionId, setConnectionId] = useState("");
  const [projectKeys, setProjectKeys] = useState<string[]>([]);
  const [projectKey, setProjectKey] = useState("");
  const [settings, setSettings] = useState<SettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form fields
  const [productVision, setProductVision] = useState("");
  const [productScope, setProductScope] = useState("");
  const [currentSprintGoals, setCurrentSprintGoals] = useState("");
  const [glossary, setGlossary] = useState("");
  const [llmGuidelines, setLlmGuidelines] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    void loadConnections();
  }, [router]);

  useEffect(() => {
    if (connectionId) {
      void loadProjectKeys(connectionId);
    }
  }, [connectionId]);

  useEffect(() => {
    if (connectionId && projectKey) {
      void loadSettings();
    } else {
      setSettings(null);
      resetForm();
    }
  }, [connectionId, projectKey]);

  const loadConnections = async () => {
    setLoadingConnections(true);
    try {
      const response = await userService.getUserConnections();
      if (response.data) {
        const jiraConnections = response.data.jira_connections || [];
        setConnections(jiraConnections);
        if (jiraConnections.length > 0) {
          const firstId = jiraConnections[0].id;
          setConnectionId(firstId);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
      } else {
        setError("Failed to load connections");
        setShowError(true);
      }
    } finally {
      setLoadingConnections(false);
    }
  };

  const loadProjectKeys = async (connId: string) => {
    try {
      const response = await userService.getProjectKeys(connId);
      if (response.data) {
        setProjectKeys(response.data);
        if (response.data.length > 0) {
          setProjectKey(response.data[0]);
        } else {
          setProjectKey("");
        }
      }
    } catch (err) {
      console.error("Failed to load project keys:", err);
      setProjectKeys([]);
      setProjectKey("");
    }
  };

  const loadSettings = async () => {
    if (!connectionId || !projectKey) return;

    setLoading(true);
    setError("");
    try {
      const response = await settingsService.getSettings(
        connectionId,
        projectKey
      );
      if (response.data) {
        setSettings(response.data);
        setProductVision(response.data.product_vision || "");
        setProductScope(response.data.product_scope || "");
        setCurrentSprintGoals(response.data.current_sprint_goals || "");
        setGlossary(response.data.glossary || "");
        setLlmGuidelines(response.data.llm_guidelines || "");
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Settings don't exist yet, that's okay
        setSettings(null);
        resetForm();
      } else if (err.response?.status === 401) {
        router.push("/login");
      } else {
        const errorMessage =
          err.response?.data?.detail || "Failed to load settings";
        setError(errorMessage);
        setShowError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProductVision("");
    setProductScope("");
    setCurrentSprintGoals("");
    setGlossary("");
    setLlmGuidelines("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionId || !projectKey) {
      setError("Please select a connection and project");
      setShowError(true);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data: CreateSettingsRequest | UpdateSettingsRequest = {
        product_vision: productVision || undefined,
        product_scope: productScope || undefined,
        current_sprint_goals: currentSprintGoals || undefined,
        glossary: glossary || undefined,
        llm_guidelines: llmGuidelines || undefined,
      };

      if (settings) {
        // Update existing settings
        await settingsService.updateSettings(connectionId, projectKey, data);
        setSuccess("Settings updated successfully");
      } else {
        // Create new settings
        await settingsService.createSettings(connectionId, projectKey, {
          ...data,
          connection_id: connectionId,
          project_key: projectKey,
        });
        setSuccess("Settings created successfully");
      }
      setShowSuccess(true);
      await loadSettings();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to save settings";
      setError(errorMessage);
      setShowError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectionChange = async (connId: string) => {
    setConnectionId(connId);
    setProjectKey("");
    setSettings(null);
    resetForm();
    await loadProjectKeys(connId);
  };

  const handleProjectKeyChange = (projKey: string) => {
    setProjectKey(projKey);
    setSettings(null);
    resetForm();
  };

  if (loadingConnections) {
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
            Settings
          </Typography>
        </Stack>
      }
    >
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, overflowY: "auto" }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>

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
            Connection & Projectasfasdfffffffffff
          </Typography>
          <Stack spacing={2}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Connection</InputLabel>
              <Select
                value={connectionId}
                onChange={(e) => handleConnectionChange(e.target.value)}
                label="Connection"
                disabled={loading}
              >
                {connections.map((conn) => (
                  <MenuItem value={conn.id} key={conn.id}>
                    <Box sx={{ display: "flex", alignItems: "center", px: 1 }}>
                      {/* Example 1: Using a local image */}
                      <img
                        src={conn.avatar_url}
                        alt="icon"
                        style={{ width: 20, height: 20, marginRight: 10 }}
                      />
                      {conn.name || conn.id}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Project</InputLabel>
              <Select
                value={projectKey}
                label="Project"
                onChange={(e) => handleProjectKeyChange(e.target.value)}
                disabled={!connectionId || projectKeys.length === 0}
              >
                {projectKeys.map((key) => (
                  <MenuItem key={key} value={key}>
                    {key}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {connectionId && projectKey && (
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
              Project Settings
            </Typography>
            {settings && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 2, display: "block" }}
              >
                Last updated: {new Date(settings.last_updated).toLocaleString()}
              </Typography>
            )}
            {loading ? (
              <LoadingSpinner />
            ) : (
              <Box component="form" onSubmit={handleSave}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Product Vision"
                    value={productVision}
                    onChange={(e) => setProductVision(e.target.value)}
                    disabled={saving}
                    placeholder="Describe the overall vision and goals for this product..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Product Scope"
                    value={productScope}
                    onChange={(e) => setProductScope(e.target.value)}
                    disabled={saving}
                    placeholder="Define what is included and excluded from this product..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Current Sprint Goals"
                    value={currentSprintGoals}
                    onChange={(e) => setCurrentSprintGoals(e.target.value)}
                    disabled={saving}
                    placeholder="Describe the goals for the current sprint..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Glossary"
                    value={glossary}
                    onChange={(e) => setGlossary(e.target.value)}
                    disabled={saving}
                    placeholder="Define key terms and concepts used in this project..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="LLM Guidelines"
                    value={llmGuidelines}
                    onChange={(e) => setLlmGuidelines(e.target.value)}
                    disabled={saving}
                    placeholder="Provide specific guidelines for how the LLM should behave when analyzing this project..."
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    fullWidth
                  >
                    {saving ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CircularProgress size={20} />
                        <span>Saving...</span>
                      </Box>
                    ) : settings ? (
                      "Update Settings"
                    ) : (
                      "Create Settings"
                    )}
                  </Button>
                </Stack>
              </Box>
            )}
          </Paper>
        )}

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
