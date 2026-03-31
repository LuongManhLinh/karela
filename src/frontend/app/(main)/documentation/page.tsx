"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AddIcon from "@mui/icons-material/Add";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import SaveIcon from "@mui/icons-material/Save";
import { Layout } from "@/components/Layout";

import {
  useTextDocsQuery,
  useCreateTextDocMutation,
  useUpdateTextDocMutation,
  useDeleteTextDocMutation,
  useFileDocsQuery,
  useUploadFileDocMutation,
  useUpdateFileDocMutation,
  useDeleteFileDocMutation,
} from "@/hooks/queries/useDocumentationQueries";
import { documentationService } from "@/services/documentationService";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { ProjectDto } from "@/types/connection";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { SessionStartForm } from "@/components/SessionStartForm";
import { useNotificationContext } from "@/providers/NotificationProvider";
import { useTranslations } from "next-intl";

const ALLOWED_UPLOAD_EXTENSIONS = ["txt", "md", "docx", "pdf", "doc"];
const ACCEPTED_UPLOAD_FILE_TYPES = ALLOWED_UPLOAD_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(",");

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
const TEXT_EXTENSIONS = ["txt", "md", "docx", "pdf"];

export default function DocumentationPage() {
  const { projects } = useWorkspaceStore();
  const [selectedProject, setSelectedProject] = useState<ProjectDto | null>(
    projects.length > 0 ? projects[0] : null,
  );

  const projectKey = selectedProject?.key || "";
  const t = useTranslations("DocumentationPage");
  const { notify } = useNotificationContext();

  const [tabIndex, setTabIndex] = useState(0);

  // Queries
  const { data: textDocsData, isLoading: isLoadingTextDocs } = useTextDocsQuery(
    projectKey || undefined,
  );
  const { data: fileDocsData, isLoading: isLoadingFileDocs } = useFileDocsQuery(
    projectKey || undefined,
  );

  // Mutations
  const { mutateAsync: createTextDoc, isPending: isCreatingText } =
    useCreateTextDocMutation();
  const { mutateAsync: updateTextDoc, isPending: isUpdatingText } =
    useUpdateTextDocMutation(projectKey);
  const { mutateAsync: deleteTextDoc, isPending: isDeletingText } =
    useDeleteTextDocMutation(projectKey);

  const { mutateAsync: uploadFileDoc, isPending: isUploadingFile } =
    useUploadFileDocMutation();
  const { mutateAsync: updateFileDoc, isPending: isUpdatingFile } =
    useUpdateFileDocMutation(projectKey);
  const { mutateAsync: deleteFileDoc, isPending: isDeletingFile } =
    useDeleteFileDocMutation(projectKey);

  const textDocs = textDocsData?.data || [];
  const fileDocs = fileDocsData?.data || [];

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- UI States for Text Documentation ---
  const [isAddingText, setIsAddingText] = useState(false);
  const [newTextName, setNewTextName] = useState("");
  const [newTextContent, setNewTextContent] = useState("");
  const [newTextDesc, setNewTextDesc] = useState("");

  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editTextContent, setEditTextContent] = useState("");
  const [editTextDesc, setEditTextDesc] = useState("");

  // --- UI States for File Documentation ---
  const [uploadDesc, setUploadDesc] = useState("");

  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editFileDesc, setEditFileDesc] = useState("");

  // --- Deletion Confirmations ---
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "text" | "file";
    name: string;
  } | null>(null);

  // Reset forms on project change
  useEffect(() => {
    setIsAddingText(false);
    setEditingTextId(null);
    setEditingFileId(null);
  }, [projectKey]);

  const handleProjectKeyChange = (project: ProjectDto | null) => {
    setSelectedProject(project);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // --- Text Actions ---
  const handleCreateTextDoc = async () => {
    if (!newTextName.trim() || !newTextContent.trim()) {
      notify(t("nameAndContentRequired"), { severity: "warning" });
      return;
    }
    try {
      await createTextDoc({
        projectKey: projectKey,
        data: {
          name: newTextName,
          content: newTextContent,
          description: newTextDesc || undefined,
        },
      });
      notify(t("textDocCreated"), {
        severity: "success",
      });
      setIsAddingText(false);
      setNewTextName("");
      setNewTextContent("");
      setNewTextDesc("");
    } catch (e: any) {
      notify(e.response?.data?.detail || t("textDocCreateFailed"), {
        severity: "error",
      });
    }
  };

  const startEditTextDoc = (doc: any) => {
    setEditingTextId(doc.id);
    setEditTextContent(doc.content || "");
    setEditTextDesc(doc.description || "");
  };

  const cancelEditTextDoc = () => {
    setEditingTextId(null);
  };

  const saveEditTextDoc = async (id: string) => {
    try {
      await updateTextDoc({
        docId: id,
        data: {
          content: editTextContent,
          description: editTextDesc || undefined,
        },
      });
      notify(t("textDocUpdated"), {
        severity: "success",
      });
      setEditingTextId(null);
    } catch (e: any) {
      notify(e.response?.data?.detail || t("textDocUpdateFailed"), {
        severity: "error",
      });
    }
  };

  // --- File Actions ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectKey) return;

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_UPLOAD_EXTENSIONS.includes(extension)) {
      notify(t("invalidFileExtension"), { severity: "warning" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      await uploadFileDoc({
        projectKey,
        file,
        description: uploadDesc,
      });
      notify(t("uploadFileSuccess"), { severity: "success" });
      setUploadDesc("");
    } catch (err: any) {
      notify(err.response?.data?.detail || t("uploadFileFailed"), {
        severity: "error",
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileDownload = async (docId: string, filename: string) => {
    try {
      const blob = await documentationService.downloadFileDoc(docId);
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

  const startEditFileDoc = (doc: any) => {
    setEditingFileId(doc.id);
    setEditFileDesc(doc.description || "");
  };

  const cancelEditFileDoc = () => {
    setEditingFileId(null);
  };

  const saveEditFileDoc = async (id: string) => {
    try {
      await updateFileDoc({
        docId: id,
        data: { description: editFileDesc || undefined },
      });
      notify(t("fileDescriptionUpdatedSuccess"), { severity: "success" });
      setEditingFileId(null);
    } catch (e: any) {
      notify(e.response?.data?.detail || t("fileDescriptionUpdateFailed"), {
        severity: "error",
      });
    }
  };

  // --- Delete confirmation ---
  const requestDelete = (id: string, type: "text" | "file", name: string) => {
    setItemToDelete({ id, type, name });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === "text") {
        await deleteTextDoc({ docId: itemToDelete.id });
      } else {
        await deleteFileDoc({ docId: itemToDelete.id });
      }
      notify(t("deleteItemSuccess"), { severity: "success" });
    } catch (e: any) {
      notify(e.response?.data?.detail || t("deleteItemFailed"), {
        severity: "error",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const getFileKindUI = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    if (IMAGE_EXTENSIONS.includes(extension)) {
      return {
        icon: <ImageIcon fontSize="small" />,
        chipLabel: t("fileTypeImage"),
        color: "success" as const,
      };
    }
    if (TEXT_EXTENSIONS.includes(extension)) {
      return {
        icon: <DescriptionIcon fontSize="small" />,
        chipLabel: t("fileTypeText"),
        color: "info" as const,
      };
    }
    return {
      icon: <InsertDriveFileIcon fontSize="small" />,
      chipLabel: t("fileTypeFile"),
      color: "default" as const,
    };
  };

  return (
    <Layout
      appBarLeftContent={
        <Typography variant="h5" py={2}>
          {t("title")}
        </Typography>
      }
      appBarTransparent
      basePath={`/app/projects/${projectKey}`}
    >
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, overflowY: "auto" }}>
        <Paper
          elevation={2}
          sx={{ p: 3, mb: 3, borderRadius: 1, bgcolor: "background.paper" }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            {t("projects")}
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
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 1,
              bgcolor: "background.paper",
              minHeight: 600,
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
              <Tabs
                value={tabIndex}
                onChange={handleTabChange}
                aria-label={t("documentationTabsAriaLabel")}
              >
                <Tab label={t("textDocumentationTab")} />
                <Tab label={t("fileDocumentationTab")} />
              </Tabs>
            </Box>

            {tabIndex === 0 && (
              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6">{t("textEntries")}</Typography>
                  {!isAddingText && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setIsAddingText(true)}
                    >
                      {t("addEntry")}
                    </Button>
                  )}
                </Stack>

                {isAddingText && (
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, mb: 3, bgcolor: "background.default" }}
                  >
                    <Stack spacing={2}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {t("newEntry")}
                      </Typography>
                      <TextField
                        fullWidth
                        label={t("nameRequiredLabel")}
                        value={newTextName}
                        onChange={(e) => setNewTextName(e.target.value)}
                        disabled={isCreatingText}
                      />
                      <TextField
                        fullWidth
                        label={t("descriptionOptionalLabel")}
                        value={newTextDesc}
                        onChange={(e) => setNewTextDesc(e.target.value)}
                        disabled={isCreatingText}
                      />
                      <TextField
                        fullWidth
                        multiline
                        minRows={5}
                        maxRows={15}
                        label={t("contentRequiredLabel")}
                        value={newTextContent}
                        onChange={(e) => setNewTextContent(e.target.value)}
                        disabled={isCreatingText}
                        sx={{ ...scrollBarSx }}
                      />
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <Button
                          variant="outlined"
                          color="inherit"
                          onClick={() => setIsAddingText(false)}
                          disabled={isCreatingText}
                        >
                          {t("cancel")}
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleCreateTextDoc}
                          disabled={isCreatingText}
                        >
                          {isCreatingText ? (
                            <CircularProgress size={20} />
                          ) : (
                            t("save")
                          )}
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                )}

                {isLoadingTextDocs ? (
                  <LoadingSpinner />
                ) : textDocs.length === 0 && !isAddingText ? (
                  <Typography color="text.secondary">
                    {t("noTextDocumentation")}
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {textDocs.map((doc) => (
                      <Paper
                        key={doc.id}
                        variant="outlined"
                        sx={{ p: 2, borderColor: "divider" }}
                      >
                        {editingTextId === doc.id ? (
                          <Stack spacing={2}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {doc.name}
                            </Typography>
                            <TextField
                              fullWidth
                              label={t("descriptionLabel")}
                              value={editTextDesc}
                              onChange={(e) => setEditTextDesc(e.target.value)}
                              disabled={isUpdatingText}
                            />
                            <TextField
                              fullWidth
                              multiline
                              minRows={5}
                              maxRows={15}
                              label={t("contentLabel")}
                              value={editTextContent}
                              onChange={(e) =>
                                setEditTextContent(e.target.value)
                              }
                              disabled={isUpdatingText}
                              sx={{ ...scrollBarSx }}
                            />
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="flex-end"
                            >
                              <IconButton
                                color="default"
                                onClick={cancelEditTextDoc}
                                disabled={isUpdatingText}
                              >
                                <CancelIcon />
                              </IconButton>
                              <IconButton
                                color="primary"
                                onClick={() => saveEditTextDoc(doc.id)}
                                disabled={isUpdatingText}
                              >
                                <SaveIcon />
                              </IconButton>
                            </Stack>
                          </Stack>
                        ) : (
                          <Stack spacing={1}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="flex-start"
                            >
                              <Box>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                >
                                  {doc.name}
                                </Typography>
                                {doc.description && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {doc.description}
                                  </Typography>
                                )}
                              </Box>
                              <Stack direction="row" spacing={0}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => startEditTextDoc(doc)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    requestDelete(doc.id, "text", doc.name)
                                  }
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Stack>
                            <Box
                              sx={{
                                p: 1.5,
                                bgcolor: "background.default",
                                borderRadius: 1,
                                maxHeight: 200,
                                overflowY: "auto",
                                ...scrollBarSx,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ whiteSpace: "pre-wrap" }}
                              >
                                {doc.content}
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {t("lastUpdated", {
                                date: new Date(doc.updated_at).toLocaleString(),
                              })}
                            </Typography>
                          </Stack>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            {tabIndex === 1 && (
              <Box>
                <Typography variant="h6" mb={2}>
                  {t("filesSectionTitle")}
                </Typography>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {t("allowedFileExtensions")}
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, mb: 3, bgcolor: "background.default" }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems="center"
                  >
                    <TextField
                      size="small"
                      fullWidth
                      label={t("uploadDescriptionOptional")}
                      value={uploadDesc}
                      onChange={(e) => setUploadDesc(e.target.value)}
                      disabled={isUploadingFile}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept={ACCEPTED_UPLOAD_FILE_TYPES}
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<UploadFileIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingFile}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      {isUploadingFile ? t("uploading") : t("uploadFile")}
                    </Button>
                  </Stack>
                </Paper>

                {isLoadingFileDocs ? (
                  <LoadingSpinner />
                ) : fileDocs.length === 0 ? (
                  <Typography color="text.secondary">
                    {t("noFileDocumentation")}
                  </Typography>
                ) : (
                  <List sx={{ p: 0 }}>
                    {fileDocs.map((doc) => {
                      const ui = getFileKindUI(doc.name);
                      return (
                        <ListItem key={doc.id} disableGutters sx={{ mb: 1 }}>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              width: "100%",
                              borderColor: "divider",
                            }}
                          >
                            {editingFileId === doc.id ? (
                              <Stack spacing={2}>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="bold"
                                >
                                  {doc.name}
                                </Typography>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label={t("descriptionLabel")}
                                  value={editFileDesc}
                                  onChange={(e) =>
                                    setEditFileDesc(e.target.value)
                                  }
                                  disabled={isUpdatingFile}
                                />
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  justifyContent="flex-end"
                                >
                                  <IconButton
                                    size="small"
                                    onClick={cancelEditFileDoc}
                                    disabled={isUpdatingFile}
                                  >
                                    <CancelIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => saveEditFileDoc(doc.id)}
                                    disabled={isUpdatingFile}
                                  >
                                    <SaveIcon />
                                  </IconButton>
                                </Stack>
                              </Stack>
                            ) : (
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Stack
                                  direction="row"
                                  spacing={1.5}
                                  alignItems="center"
                                >
                                  {ui.icon}
                                  <Box>
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      alignItems="center"
                                    >
                                      <Typography
                                        variant="body2"
                                        fontWeight="bold"
                                      >
                                        {doc.name}
                                      </Typography>
                                      <Chip
                                        size="small"
                                        label={ui.chipLabel}
                                        color={ui.color}
                                        variant="outlined"
                                      />
                                    </Stack>
                                    {doc.description && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {doc.description}
                                      </Typography>
                                    )}
                                    <Typography
                                      variant="caption"
                                      color="text.disabled"
                                      display="block"
                                    >
                                      {t("updatedAt", {
                                        date: new Date(
                                          doc.updated_at,
                                        ).toLocaleString(),
                                      })}
                                    </Typography>
                                  </Box>
                                </Stack>
                                <Stack direction="row" spacing={0.5}>
                                  <IconButton
                                    color="default"
                                    size="small"
                                    onClick={() => startEditFileDoc(doc)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() =>
                                      handleFileDownload(doc.id, doc.name)
                                    }
                                  >
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    color="error"
                                    size="small"
                                    onClick={() =>
                                      requestDelete(doc.id, "file", doc.name)
                                    }
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              </Stack>
                            )}
                          </Paper>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </Box>
            )}
          </Paper>
        )}
      </Container>

      {/* Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={closeDeleteConfirm}>
        <DialogTitle>{t("confirmDeletionTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("confirmDeletionMessagePrefix")} <b>{itemToDelete?.name}</b>?{" "}
            {t("confirmDeletionMessageSuffix")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm} color="inherit">
            {t("cancel")}
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={isDeletingText || isDeletingFile}
          >
            {isDeletingText || isDeletingFile ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("delete")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
