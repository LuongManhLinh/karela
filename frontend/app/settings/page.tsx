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

import { useUserConnectionsQuery, useProjectKeysQuery } from "@/hooks/queries/useUserQueries";
import { useSettingsQuery, useCreateSettingsMutation, useUpdateSettingsMutation } from "@/hooks/queries/useSettingsQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { ErrorSnackbar } from "@/components/ErrorSnackbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import type {
  SettingsDto,
  CreateSettingsRequest,
  UpdateSettingsRequest,
} from "@/types/settings";
import type { JiraConnectionDto } from "@/types/integration";
import { getToken } from "@/utils/jwt_utils";

export default function SettingsPage() {
  const router = useRouter();

  // Global State
  const { 
    selectedConnectionId, setSelectedConnectionId,
    selectedProjectKey, setSelectedProjectKey 
  } = useWorkspaceStore();

  // Queries
  const { data: connectionsData, isLoading: isConnectionsLoading } = useUserConnectionsQuery();
  const { data: projectKeysData } = useProjectKeysQuery(selectedConnectionId || undefined);
  const { data: settingsData, isLoading: isSettingsLoading } = useSettingsQuery(selectedConnectionId || undefined, selectedProjectKey || undefined);
  
  // Mutations
  const { mutateAsync: createSettings, isPending: isCreating } = useCreateSettingsMutation();
  const { mutateAsync: updateSettings, isPending: isUpdating } = useUpdateSettingsMutation();

  const connections = connectionsData?.data?.jira_connections || [];
  const projectKeys = projectKeysData?.data || [];
  const settings = settingsData?.data;
  
  // Local state for form fields only
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

  // Effects to set initial selections
  useEffect(() => {
    if (connections.length > 0) {
        if (!selectedConnectionId || !connections.find(c => c.id === selectedConnectionId)) {
            setSelectedConnectionId(connections[0].id);
        }
    }
  }, [connections, selectedConnectionId, setSelectedConnectionId]);

  useEffect(() => {
    if (projectKeys.length > 0) {
        if (!selectedProjectKey || !projectKeys.includes(selectedProjectKey)) {
             setSelectedProjectKey(projectKeys[0]);
        }
    } else if (projectKeys.length === 0 && selectedProjectKey) {
        setSelectedProjectKey(null);
    }
  }, [projectKeys, selectedProjectKey, setSelectedProjectKey]);

  // Effect to populate form when settings change
  useEffect(() => {
    if (settings) {
      setProductVision(settings.product_vision || "");
      setProductScope(settings.product_scope || "");
      setCurrentSprintGoals(settings.current_sprint_goals || "");
      setGlossary(settings.glossary || "");
      setLlmGuidelines(settings.llm_guidelines || "");
    } else {
      resetForm();
    }
  }, [settings]);

  const resetForm = () => {
    setProductVision("");
    setProductScope("");
    setCurrentSprintGoals("");
    setGlossary("");
    setLlmGuidelines("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnectionId || !selectedProjectKey) {
      setError("Please select a connection and project");
      setShowError(true);
      return;
    }

    const isSaving = isCreating || isUpdating;
    if (isSaving) return;

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
        await updateSettings({ connectionId: selectedConnectionId, projectKey: selectedProjectKey, data });
        setSuccess("Settings updated successfully");
      } else {
        await createSettings({ connectionId: selectedConnectionId, projectKey: selectedProjectKey, data: { ...data, connection_id: selectedConnectionId, project_key: selectedProjectKey } });
        setSuccess("Settings created successfully");
      }
      setShowSuccess(true);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to save settings";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const handleConnectionChange = async (connId: string) => {
    setSelectedConnectionId(connId);
    resetForm();
  };

  const handleProjectKeyChange = (projKey: string) => {
    setSelectedProjectKey(projKey);
    resetForm();
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
          <Typography variant="h5">Settings</Typography>
        </Stack>
      }
      appBarTransparent
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
            Connection & Projects
          </Typography>
          <Stack spacing={2}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Connection</InputLabel>
              <Select
                value={selectedConnectionId || ""}
                onChange={(e) => handleConnectionChange(e.target.value)}
                label="Connection"
                disabled={isSettingsLoading}
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
                value={selectedProjectKey || ""}
                label="Project"
                onChange={(e) => handleProjectKeyChange(e.target.value)}
                disabled={!selectedConnectionId || projectKeys.length === 0}
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

        {selectedConnectionId && selectedProjectKey && (
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
                Last updated: {new Date(settings.updated_at).toLocaleString()}
              </Typography>
            )}
            {isSettingsLoading ? (
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
                    disabled={isCreating || isUpdating}
                    placeholder="Describe the overall vision and goals for this product..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Product Scope"
                    value={productScope}
                    onChange={(e) => setProductScope(e.target.value)}
                    disabled={isCreating || isUpdating}
                    placeholder="Define what is included and excluded from this product..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Current Sprint Goals"
                    value={currentSprintGoals}
                    onChange={(e) => setCurrentSprintGoals(e.target.value)}
                    disabled={isCreating || isUpdating}
                    placeholder="Describe the goals for the current sprint..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Glossary"
                    value={glossary}
                    onChange={(e) => setGlossary(e.target.value)}
                    disabled={isCreating || isUpdating}
                    placeholder="Define key terms and concepts used in this project..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="LLM Guidelines"
                    value={llmGuidelines}
                    onChange={(e) => setLlmGuidelines(e.target.value)}
                    disabled={isCreating || isUpdating}
                    placeholder="Provide specific guidelines for how the LLM should behave when analyzing this project..."
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isCreating || isUpdating}
                    fullWidth
                  >
                    {isCreating || isUpdating ? (
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
