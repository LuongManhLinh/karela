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
} from "@mui/material";
import { Layout } from "@/components/Layout";

import {
  useSettingsQuery,
  useCreateSettingsMutation,
  useUpdateSettingsMutation,
} from "@/hooks/queries/useSettingsQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type {
  CreateSettingsRequest,
  UpdateSettingsRequest,
} from "@/types/settings";
import type { ConnectionDto, ProjectDto } from "@/types/connection";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { SessionStartForm } from "@/components/SessionStartForm";
import { useNotificationContext } from "@/providers/NotificationProvider";
import { useParams } from "next/navigation";

const MIN_TEXTFIELD_ROWS = 3;
const MAX_TEXTFIELD_ROWS = 20;

export default function DocumentationPage() {
  const params = useParams();
  const projectKey = useMemo(() => {
    return params.projectKey as string;
  }, [params]);
  const { connection, selectedProject, setSelectedProject, projects } =
    useWorkspaceStore();

  const { data: settingsData, isLoading: isSettingsLoading } =
    useSettingsQuery(projectKey);

  // Mutations
  const { mutateAsync: createSettings, isPending: isCreating } =
    useCreateSettingsMutation();
  const { mutateAsync: updateSettings, isPending: isUpdating } =
    useUpdateSettingsMutation();

  const settings = settingsData?.data;

  const { notify } = useNotificationContext();

  // Form fields
  const [productVision, setProductVision] = useState("");
  const [productScope, setProductScope] = useState("");
  const [currentSprintGoals, setCurrentSprintGoals] = useState("");
  const [glossary, setGlossary] = useState("");
  const [llmGuidelines, setLlmGuidelines] = useState("");

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
    if (!connection || !projectKey) {
      notify("Please select a connection and project", { severity: "warning" });
      return;
    }

    const isSaving = isCreating || isUpdating;
    if (isSaving) return;

    try {
      const data: CreateSettingsRequest | UpdateSettingsRequest = {
        product_vision: productVision || undefined,
        product_scope: productScope || undefined,
        current_sprint_goals: currentSprintGoals || undefined,
        glossary: glossary || undefined,
        llm_guidelines: llmGuidelines || undefined,
      };

      if (settings) {
        await updateSettings({
          projectKey,
          data,
        });
        notify("Settings updated successfully", { severity: "success" });
      } else {
        await createSettings({
          projectKey,
          data,
        });
        notify("Settings created successfully", { severity: "success" });
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to save settings";
      notify(errorMessage, { severity: "error" });
    }
  };

  const handleProjectKeyChange = (project: ProjectDto | null) => {
    setSelectedProject(project || null);
    resetForm();
  };

  return (
    <Layout
      appBarLeftContent={
        <Stack direction={"row"} alignItems="center" spacing={2} py={2}>
          <Typography variant="h5">Documentation</Typography>
        </Stack>
      }
      appBarTransparent
      basePath={`/app/projects/${selectedProject?.key}`}
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
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Connection & Projects
          </Typography>
          <SessionStartForm
            projectOptions={{
              options: projects,
              selectedOption: selectedProject,
              onChange: handleProjectKeyChange,
            }}
          />
        </Paper>

        {connection && selectedProject && (
          <Paper
            elevation={2}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 1,
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Project Documentation
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
                    label="Product Vision"
                    value={productVision}
                    onChange={(e) => setProductVision(e.target.value)}
                    disabled={isCreating || isUpdating}
                    placeholder="Describe the overall vision and goals for this product..."
                    minRows={MIN_TEXTFIELD_ROWS}
                    maxRows={MAX_TEXTFIELD_ROWS}
                    sx={{ ...scrollBarSx }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    label="Product Scope"
                    value={productScope}
                    onChange={(e) => setProductScope(e.target.value)}
                    disabled={isCreating || isUpdating}
                    placeholder="Define what is included and excluded from this product..."
                    minRows={MIN_TEXTFIELD_ROWS}
                    maxRows={MAX_TEXTFIELD_ROWS}
                    sx={{ ...scrollBarSx }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    label="Current Sprint Goals"
                    value={currentSprintGoals}
                    onChange={(e) => setCurrentSprintGoals(e.target.value)}
                    disabled={isCreating || isUpdating}
                    placeholder="Describe the goals for the current sprint..."
                    minRows={MIN_TEXTFIELD_ROWS}
                    maxRows={MAX_TEXTFIELD_ROWS}
                    sx={{ ...scrollBarSx }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    label="Glossary"
                    value={glossary}
                    onChange={(e) => setGlossary(e.target.value)}
                    disabled={isCreating || isUpdating}
                    placeholder="Define key terms and concepts used in this project..."
                    minRows={MIN_TEXTFIELD_ROWS}
                    maxRows={MAX_TEXTFIELD_ROWS}
                    sx={{ ...scrollBarSx }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    label="LLM Guidelines"
                    value={llmGuidelines}
                    onChange={(e) => setLlmGuidelines(e.target.value)}
                    disabled={isCreating || isUpdating}
                    placeholder="Provide specific guidelines for how the LLM should behave when analyzing this project..."
                    minRows={MIN_TEXTFIELD_ROWS}
                    maxRows={MAX_TEXTFIELD_ROWS}
                    sx={{ ...scrollBarSx }}
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
      </Container>
    </Layout>
  );
}
