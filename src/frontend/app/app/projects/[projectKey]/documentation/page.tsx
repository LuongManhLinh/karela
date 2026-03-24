"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Stack,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Layout } from "@/components/Layout";

import {
  useSettingsQuery,
  useCreateSettingsMutation,
  useUpdateSettingsMutation,
  useUploadFileMutation,
  useDeleteFileMutation,
} from "@/hooks/queries/useSettingsQueries";
import { settingsService } from "@/services/settingsService";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type {
  CreateSettingsRequest,
  UpdateSettingsRequest,
} from "@/types/settings";
import type { ProjectDto } from "@/types/connection";
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

  const { mutateAsync: createSettings, isPending: isCreating } =
    useCreateSettingsMutation();
  const { mutateAsync: updateSettings, isPending: isUpdating } =
    useUpdateSettingsMutation();
  const { mutateAsync: uploadFile, isPending: isUploading } =
    useUploadFileMutation();
  const { mutateAsync: deleteFile, isPending: isDeleting } =
    useDeleteFileMutation();

  const settings = settingsData?.data;
  const { notify } = useNotificationContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [productVision, setProductVision] = useState("");
  const [productScope, setProductScope] = useState("");
  const [currentSprintGoals, setCurrentSprintGoals] = useState("");
  const [glossary, setGlossary] = useState("");

  // Effect to populate form when settings change
  useEffect(() => {
    if (settings) {
      setProductVision(settings.product_vision || "");
      setProductScope(settings.product_scope || "");
      setCurrentSprintGoals(settings.current_sprint_goals || "");
      setGlossary(settings.glossary || "");
    } else {
      resetForm();
    }
  }, [settings]);

  const resetForm = () => {
    setProductVision("");
    setProductScope("");
    setCurrentSprintGoals("");
    setGlossary("");
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
      };

      if (settings) {
        await updateSettings({ projectKey, data });
        notify("Settings updated successfully", { severity: "success" });
      } else {
        await createSettings({ projectKey, data });
        notify("Settings created successfully", { severity: "success" });
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to save settings";
      notify(errorMessage, { severity: "error" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectKey) return;

    try {
      await uploadFile({ projectKey, file });
      notify("File uploaded successfully", { severity: "success" });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to upload file";
      notify(errorMessage, { severity: "error" });
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileDownload = async (filename: string) => {
    if (!projectKey) return;
    try {
      const blob = await settingsService.downloadFile(projectKey, filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      notify("Failed to download file", { severity: "error" });
    }
  };

  const handleFileDelete = async (filename: string) => {
    if (!projectKey) return;
    try {
      await deleteFile({ projectKey, filename });
      notify("File deleted successfully", { severity: "success" });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to delete file";
      notify(errorMessage, { severity: "error" });
    }
  };

  const handleProjectKeyChange = (project: ProjectDto | null) => {
    setSelectedProject(project || null);
    resetForm();
  };

  const additionalFiles = settings?.additional_files || [];

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
            Connection &amp; Projects
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
          <>
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

            {/* Additional Files Section */}
            {settings && (
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
                  Additional Files
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Upload supplementary files for this project. These files will
                  be stored and can be downloaded later.
                </Typography>

                {/* Upload button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <Button
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  sx={{ mb: 2 }}
                >
                  {isUploading ? (
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <CircularProgress size={16} />
                      <span>Uploading...</span>
                    </Box>
                  ) : (
                    "Upload File"
                  )}
                </Button>

                {/* File list */}
                {additionalFiles.length > 0 ? (
                  <List dense>
                    {additionalFiles.map((file) => (
                      <ListItem key={file.filename}>
                        <ListItemText primary={file.filename} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="download"
                            onClick={() => handleFileDownload(file.filename)}
                            sx={{ mr: 0.5 }}
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleFileDelete(file.filename)}
                            disabled={isDeleting}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No files uploaded yet.
                  </Typography>
                )}
              </Paper>
            )}
          </>
        )}
      </Container>
    </Layout>
  );
}
