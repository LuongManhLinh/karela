"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Chip,
  IconButton,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AddIcon from "@mui/icons-material/Add";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { Layout } from "@/components/Layout";

import {
  useDocumentationQuery,
  useCreateDocumentationMutation,
  useUpdateDocumentationMutation,
  useUploadFileMutation,
  useDeleteFileMutation,
} from "@/hooks/queries/useSettingsQueries";
import { settingsService } from "@/services/settingsService";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type {
  CreateSettingsRequest as CreateDocumentationRequest,
  UpdateSettingsRequest as UpdateDocumentationRequest,
  AdditionalDocDto,
} from "@/types/settings";
import type { ProjectDto } from "@/types/connection";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { SessionStartForm } from "@/components/SessionStartForm";
import { useNotificationContext } from "@/providers/NotificationProvider";
import { useTranslations } from "next-intl";

const MIN_TEXTFIELD_ROWS = 3;
const MAX_TEXTFIELD_ROWS = 20;

type AdditionalFileKind = "image" | "text" | "other";

const IMAGE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "tiff",
  "ico",
];

const TEXT_EXTENSIONS = [
  "txt",
  "md",
  "json",
  "yaml",
  "yml",
  "xml",
  "csv",
  "log",
  "pdf",
  "doc",
  "docx",
  "rtf",
];

export default function DocumentationPage() {
  const { projects } = useWorkspaceStore();

  const [selectedProject, setSelectedProject] = useState<ProjectDto | null>(
    projects.length > 0 ? projects[0] : null,
  );

  const { data: docData, isLoading: isDocLoading } = useDocumentationQuery(
    selectedProject?.key,
  );

  const t = useTranslations("DocumentationPage");

  const { mutateAsync: createDocs, isPending: isCreating } =
    useCreateDocumentationMutation();
  const { mutateAsync: updateDocs, isPending: isUpdating } =
    useUpdateDocumentationMutation();
  const { mutateAsync: uploadFile, isPending: isUploading } =
    useUploadFileMutation();
  const { mutateAsync: deleteFile, isPending: isDeleting } =
    useDeleteFileMutation();

  const doc = docData?.data;
  const { notify } = useNotificationContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [productVision, setProductVision] = useState("");
  const [productScope, setProductScope] = useState("");
  const [currentSprintGoals, setCurrentSprintGoals] = useState("");
  const [glossary, setGlossary] = useState("");
  const [additionalDocs, setAdditionalDocs] = useState<AdditionalDocDto[]>([]);
  const [fileDescription, setFileDescription] = useState("");
  const [fileDescriptions, setFileDescriptions] = useState<
    Record<string, string>
  >({});

  // Effect to populate form when settings change
  useEffect(() => {
    if (doc) {
      setProductVision(doc.product_vision || "");
      setProductScope(doc.product_scope || "");
      setCurrentSprintGoals(doc.current_sprint_goals || "");
      setGlossary(doc.glossary || "");
      setAdditionalDocs(doc.additional_docs || []);
      setFileDescriptions(
        (doc.additional_files || []).reduce<Record<string, string>>(
          (acc, file) => {
            acc[file.filename] = file.description || "";
            return acc;
          },
          {},
        ),
      );
      setFileDescription("");
    } else {
      resetForm();
    }
  }, [doc, notify]);

  const resetForm = () => {
    setProductVision("");
    setProductScope("");
    setCurrentSprintGoals("");
    setGlossary("");
    setAdditionalDocs([]);
    setFileDescriptions({});
    setFileDescription("");
  };

  const normalizeAdditionalDocs = () => {
    return additionalDocs
      .map((item) => ({
        title: item.title.trim(),
        content: item.content.trim(),
        description: item.description?.trim() || undefined,
      }))
      .filter(
        (item) =>
          item.title.length > 0 ||
          item.content.length > 0 ||
          (item.description?.length || 0) > 0,
      );
  };

  const buildAdditionalFilesPayload = () => {
    if (!doc?.additional_files) {
      return [];
    }

    return doc.additional_files.map((file) => ({
      filename: file.filename,
      url: file.url,
      description: fileDescriptions[file.filename]?.trim() || undefined,
    }));
  };

  const handleAddAdditionalDoc = () => {
    setAdditionalDocs((prev) => [
      ...prev,
      { title: "", content: "", description: "" },
    ]);
  };

  const handleRemoveAdditionalDoc = (index: number) => {
    setAdditionalDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAdditionalDocChange = (
    index: number,
    field: keyof AdditionalDocDto,
    value: string,
  ) => {
    setAdditionalDocs((prev) =>
      prev.map((docItem, i) =>
        i === index ? { ...docItem, [field]: value } : docItem,
      ),
    );
  };

  const handleFileDescriptionChange = (filename: string, value: string) => {
    setFileDescriptions((prev) => ({ ...prev, [filename]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      notify(t("selectProjectWarning"), { severity: "warning" });
      return;
    }

    const isSaving = isCreating || isUpdating;
    if (isSaving) return;

    try {
      const data: CreateDocumentationRequest | UpdateDocumentationRequest = {
        product_vision: productVision || undefined,
        product_scope: productScope || undefined,
        current_sprint_goals: currentSprintGoals || undefined,
        glossary: glossary || undefined,
        additional_docs: normalizeAdditionalDocs(),
        additional_files: buildAdditionalFilesPayload(),
      };

      if (doc) {
        await updateDocs({ projectKey: selectedProject.key, data });
        notify(t("documentationUpdatedSuccess"), { severity: "success" });
      } else {
        await createDocs({ projectKey: selectedProject.key, data });
        notify(t("documentationCreatedSuccess"), { severity: "success" });
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || t("saveDocumentationFailed");
      notify(errorMessage, { severity: "error" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) return;

    try {
      await uploadFile({
        projectKey: selectedProject.key,
        file,
        description: fileDescription,
      });
      notify(t("uploadFileSuccess"), { severity: "success" });
      setFileDescription("");
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || t("uploadFileFailed");
      notify(errorMessage, { severity: "error" });
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileDownload = async (filename: string) => {
    if (!selectedProject) return;
    try {
      const blob = await settingsService.downloadFile(
        selectedProject.key,
        filename,
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      notify(t("downloadFileFailed"), { severity: "error" });
    }
  };

  const handleFileDelete = async (filename: string) => {
    if (!selectedProject) return;
    try {
      await deleteFile({ projectKey: selectedProject.key, filename });
      notify(t("deleteFileSuccess"), { severity: "success" });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || t("deleteFileFailed");
      notify(errorMessage, { severity: "error" });
    }
  };

  const handleProjectKeyChange = (project: ProjectDto | null) => {
    setSelectedProject(project);
    resetForm();
  };

  const handleSaveFileDescriptions = async () => {
    if (!selectedProject || !doc) {
      return;
    }

    try {
      await updateDocs({
        projectKey: selectedProject.key,
        data: {
          additional_files: buildAdditionalFilesPayload(),
        },
      });
      notify(t("fileDescriptionsUpdatedSuccess"), { severity: "success" });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || t("saveFileDescriptionsFailed");
      notify(errorMessage, { severity: "error" });
    }
  };

  const getFileKind = (filename: string): AdditionalFileKind => {
    const extension = filename.split(".").pop()?.toLowerCase() || "";

    if (IMAGE_EXTENSIONS.includes(extension)) {
      return "image";
    }

    if (TEXT_EXTENSIONS.includes(extension)) {
      return "text";
    }

    return "other";
  };

  const getFileKindUI = (filename: string) => {
    const kind = getFileKind(filename);

    if (kind === "image") {
      return {
        icon: <ImageIcon fontSize="small" />,
        chipLabel: t("fileTypeImage"),
        iconColor: "success.main",
        chipColor: "success" as const,
      };
    }

    if (kind === "text") {
      return {
        icon: <DescriptionIcon fontSize="small" />,
        chipLabel: t("fileTypeText"),
        iconColor: "info.main",
        chipColor: "info" as const,
      };
    }

    return {
      icon: <InsertDriveFileIcon fontSize="small" />,
      chipLabel: t("fileTypeFile"),
      iconColor: "text.secondary",
      chipColor: "default" as const,
    };
  };

  const additionalFiles = doc?.additional_files || [];

  return (
    <Layout
      appBarLeftContent={
        <Stack direction={"row"} alignItems="center" spacing={2} py={2}>
          <Typography variant="h5">{t("title")}</Typography>
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
            {t("connectionAndProjects")}
          </Typography>
          <SessionStartForm
            projectOptions={{
              options: projects,
              selectedOption: selectedProject,
              onChange: handleProjectKeyChange,
            }}
          />
        </Paper>

        {selectedProject && (
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
                {t("projectDocumentation")}
              </Typography>
              {doc && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 2, display: "block" }}
                >
                  {t("lastUpdated", {
                    date: new Date(doc.updated_at).toLocaleString(),
                  })}
                </Typography>
              )}
              {isDocLoading ? (
                <LoadingSpinner />
              ) : (
                <Box component="form" onSubmit={handleSave}>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      multiline
                      label={t("productVision")}
                      value={productVision}
                      onChange={(e) => setProductVision(e.target.value)}
                      disabled={isCreating || isUpdating}
                      placeholder={t("productVisionPlaceholder")}
                      minRows={MIN_TEXTFIELD_ROWS}
                      maxRows={MAX_TEXTFIELD_ROWS}
                      sx={{ ...scrollBarSx }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      label={t("productScope")}
                      value={productScope}
                      onChange={(e) => setProductScope(e.target.value)}
                      disabled={isCreating || isUpdating}
                      placeholder={t("productScopePlaceholder")}
                      minRows={MIN_TEXTFIELD_ROWS}
                      maxRows={MAX_TEXTFIELD_ROWS}
                      sx={{ ...scrollBarSx }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      label={t("currentSprintGoals")}
                      value={currentSprintGoals}
                      onChange={(e) => setCurrentSprintGoals(e.target.value)}
                      disabled={isCreating || isUpdating}
                      placeholder={t("currentSprintGoalsPlaceholder")}
                      minRows={MIN_TEXTFIELD_ROWS}
                      maxRows={MAX_TEXTFIELD_ROWS}
                      sx={{ ...scrollBarSx }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      label={t("glossary")}
                      value={glossary}
                      onChange={(e) => setGlossary(e.target.value)}
                      disabled={isCreating || isUpdating}
                      placeholder={t("glossaryPlaceholder")}
                      minRows={MIN_TEXTFIELD_ROWS}
                      maxRows={MAX_TEXTFIELD_ROWS}
                      sx={{ ...scrollBarSx }}
                    />

                    <Divider sx={{ pt: 1 }} />

                    <Stack spacing={3}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography variant="h6">
                          {t("additionalDocs")}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={handleAddAdditionalDoc}
                          disabled={isCreating || isUpdating}
                        >
                          {t("addAdditionalDoc")}
                        </Button>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {t("additionalDocsDescription")}
                      </Typography>

                      {additionalDocs.length > 0 ? (
                        <Stack spacing={2}>
                          {additionalDocs.map((item, index) => (
                            <Box key={`additional-doc-${index}`}>
                              <Stack spacing={1.5}>
                                <TextField
                                  fullWidth
                                  label={t("additionalDocTitle")}
                                  value={item.title}
                                  onChange={(e) =>
                                    handleAdditionalDocChange(
                                      index,
                                      "title",
                                      e.target.value,
                                    )
                                  }
                                  disabled={isCreating || isUpdating}
                                />
                                <TextField
                                  fullWidth
                                  multiline
                                  minRows={MIN_TEXTFIELD_ROWS}
                                  maxRows={MAX_TEXTFIELD_ROWS}
                                  label={t("additionalDocContent")}
                                  value={item.content}
                                  onChange={(e) =>
                                    handleAdditionalDocChange(
                                      index,
                                      "content",
                                      e.target.value,
                                    )
                                  }
                                  disabled={isCreating || isUpdating}
                                  sx={{ ...scrollBarSx }}
                                />
                                <TextField
                                  fullWidth
                                  label={t("additionalDocDescription")}
                                  value={item.description || ""}
                                  onChange={(e) =>
                                    handleAdditionalDocChange(
                                      index,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                  disabled={isCreating || isUpdating}
                                />
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <Button
                                    color="error"
                                    onClick={() =>
                                      handleRemoveAdditionalDoc(index)
                                    }
                                    disabled={isCreating || isUpdating}
                                  >
                                    {t("removeAdditionalDoc")}
                                  </Button>
                                </Box>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {t("noAdditionalDocs")}
                        </Typography>
                      )}
                    </Stack>

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
                          <span>{t("saving")}</span>
                        </Box>
                      ) : doc ? (
                        t("updateDocumentation")
                      ) : (
                        t("createDocumentation")
                      )}
                    </Button>
                  </Stack>
                </Box>
              )}
            </Paper>

            {/* Additional Files Section */}
            {doc && (
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
                  {t("additionalFiles")}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {t("additionalFilesDescription")}
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
                  sx={{ mb: 2, alignSelf: "flex-start" }}
                >
                  {isUploading ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={16} />
                      <span>{t("uploading")}</span>
                    </Box>
                  ) : (
                    t("uploadFile")
                  )}
                </Button>

                <TextField
                  fullWidth
                  label={t("uploadFileDescriptionLabel")}
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  placeholder={t("uploadFileDescriptionPlaceholder")}
                  disabled={isUploading}
                  sx={{ mb: 2 }}
                />

                {/* File list */}
                {additionalFiles.length > 0 ? (
                  <>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {t("fileDescriptionsHint")}
                    </Typography>
                    <List dense sx={{ p: 0 }}>
                      {additionalFiles.map((file) => {
                        const fileKindUI = getFileKindUI(file.filename);

                        return (
                          <ListItem
                            key={file.filename}
                            disableGutters
                            sx={{ mb: 1 }}
                          >
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 1.5,
                                width: "100%",
                                borderColor: "divider",
                                bgcolor: "background.default",
                              }}
                            >
                              <Stack spacing={1.5}>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                  justifyContent="space-between"
                                  flexWrap="wrap"
                                  useFlexGap
                                >
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{ minWidth: 0 }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 30,
                                        height: 30,
                                        borderRadius: 1,
                                        bgcolor: "action.hover",
                                        color: fileKindUI.iconColor,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {fileKindUI.icon}
                                    </Box>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 600,
                                        wordBreak: "break-all",
                                        minWidth: 0,
                                      }}
                                    >
                                      {file.filename}
                                    </Typography>
                                    <Chip
                                      label={fileKindUI.chipLabel}
                                      size="small"
                                      color={fileKindUI.chipColor}
                                      variant="outlined"
                                    />
                                  </Stack>

                                  <Stack direction="row" spacing={0.5}>
                                    <IconButton
                                      aria-label={t("downloadAriaLabel")}
                                      onClick={() =>
                                        handleFileDownload(file.filename)
                                      }
                                      color="primary"
                                    >
                                      <DownloadIcon />
                                    </IconButton>
                                    <IconButton
                                      aria-label={t("deleteAriaLabel")}
                                      onClick={() =>
                                        handleFileDelete(file.filename)
                                      }
                                      disabled={isDeleting || isUpdating}
                                      color="error"
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Stack>
                                </Stack>

                                <TextField
                                  fullWidth
                                  size="small"
                                  label={t("fileDescriptionLabel")}
                                  value={fileDescriptions[file.filename] || ""}
                                  onChange={(e) =>
                                    handleFileDescriptionChange(
                                      file.filename,
                                      e.target.value,
                                    )
                                  }
                                  disabled={isUpdating || isDeleting}
                                />
                              </Stack>
                            </Paper>
                          </ListItem>
                        );
                      })}
                    </List>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        mt: 1,
                      }}
                    >
                      <Button
                        variant="contained"
                        onClick={handleSaveFileDescriptions}
                        disabled={isUpdating || isDeleting}
                      >
                        {t("saveFileDescriptions")}
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t("noFilesUploaded")}
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
