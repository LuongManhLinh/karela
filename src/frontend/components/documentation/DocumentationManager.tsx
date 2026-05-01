import React, { useState, useRef, useEffect } from "react";
import {
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

import {
  useTextDocsQuery,
  useCreateTextDocMutation,
  useUpdateTextDocMutation,
  useDeleteTextDocMutation,
  useFileDocsQuery,
  useUpdateFileDocMutation,
  useDeleteFileDocMutation,
} from "@/hooks/queries/useDocumentationQueries";
import { documentationService } from "@/services/documentationService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { useNotificationContext } from "@/providers/NotificationProvider";
import { useTranslations } from "next-intl";
import { TextDocEditor } from "./TextDocEditor";
import { TextDocItem } from "./TextDocPendingItem";
import { FileDocItem } from "./FileDocItem";
import { FileDocEditor } from "./FileDocEditor";

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

export interface DocumentationManagerProps {
  projectKey: string;
  pendingTextDocs: PendingTextDoc[];
  setPendingTextDocs: React.Dispatch<React.SetStateAction<PendingTextDoc[]>>;
  pendingFileDocs: PendingFileDoc[];
  setPendingFileDocs: React.Dispatch<React.SetStateAction<PendingFileDoc[]>>;
  onSavePending?: () => void;
  isSavingPending?: boolean;
}

export interface PendingDoc {
  id: string;
  name: string;
  description?: string;
}

export interface PendingTextDoc extends PendingDoc {
  content: string;
}

export interface PendingFileDoc extends PendingDoc {
  file: File;
}

export const DocumentationManager: React.FC<DocumentationManagerProps> = ({
  projectKey,
  pendingTextDocs,
  setPendingTextDocs,
  pendingFileDocs,
  setPendingFileDocs,
  onSavePending,
  isSavingPending = false,
}) => {
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
  const { mutateAsync: updateTextDoc, isPending: isUpdatingText } =
    useUpdateTextDocMutation(projectKey);
  const { mutateAsync: deleteTextDoc, isPending: isDeletingText } =
    useDeleteTextDocMutation(projectKey);

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

  // --- UI States for Pending Edits ---
  const [editingPendingTextId, setEditingPendingTextId] = useState<
    string | null
  >(null);
  const [pendingTextEditName, setPendingTextEditName] = useState("");
  const [pendingTextEditContent, setPendingTextEditContent] = useState("");
  const [pendingTextEditDesc, setPendingTextEditDesc] = useState("");

  const [editingPendingFileId, setEditingPendingFileId] = useState<
    string | null
  >(null);
  const [pendingFileEditDesc, setPendingFileEditDesc] = useState("");

  // Reset forms on project change
  useEffect(() => {
    setIsAddingText(false);
    setEditingTextId(null);
    setEditingFileId(null);
    setEditingPendingTextId(null);
    setEditingPendingFileId(null);
  }, [projectKey]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // --- Text Actions ---
  const handleCreateTextDoc = () => {
    if (!newTextName.trim() || !newTextContent.trim()) {
      notify(t("nameAndContentRequired"), { severity: "warning" });
      return;
    }

    setPendingTextDocs((prev) => [
      ...prev,
      {
        id: `pending-text-${Date.now()}`,
        name: newTextName,
        content: newTextContent,
        description: newTextDesc || undefined,
      },
    ]);
    notify(t("textDocAddedToPending"), { severity: "success" });
    setIsAddingText(false);
    setNewTextName("");
    setNewTextContent("");
    setNewTextDesc("");
  };

  const handleRemovePendingText = (id: string) => {
    setPendingTextDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const startEditPendingText = (doc: PendingTextDoc) => {
    setEditingPendingTextId(doc.id);
    setPendingTextEditName(doc.name);
    setPendingTextEditContent(doc.content);
    setPendingTextEditDesc(doc.description || "");
  };

  const savePendingTextEdit = () => {
    if (!pendingTextEditName.trim() || !pendingTextEditContent.trim()) {
      notify(t("nameAndContentRequired"), { severity: "warning" });
      return;
    }
    setPendingTextDocs((docs) =>
      docs.map((d) =>
        d.id === editingPendingTextId
          ? {
              ...d,
              name: pendingTextEditName,
              content: pendingTextEditContent,
              description: pendingTextEditDesc || undefined,
            }
          : d,
      ),
    );
    setEditingPendingTextId(null);
  };

  const cancelPendingTextEdit = () => setEditingPendingTextId(null);

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
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectKey) return;

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_UPLOAD_EXTENSIONS.includes(extension)) {
      notify(t("invalidFileExtension"), { severity: "warning" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPendingFileDocs((prev) => [
      ...prev,
      {
        id: `pending-file-${Date.now()}`,
        file,
        name: file.name,
        description: uploadDesc,
      },
    ]);
    notify(t("fileAddedToPending"), { severity: "success" });
    setUploadDesc("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePendingFile = (id: string) => {
    setPendingFileDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const startEditPendingFile = (doc: PendingFileDoc) => {
    setEditingPendingFileId(doc.id);
    setPendingFileEditDesc(doc.description || "");
  };

  const savePendingFileEdit = () => {
    setPendingFileDocs((docs) =>
      docs.map((d) =>
        d.id === editingPendingFileId
          ? { ...d, description: pendingFileEditDesc || undefined }
          : d,
      ),
    );
    setEditingPendingFileId(null);
  };

  const cancelPendingFileEdit = () => setEditingPendingFileId(null);

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

  const hasPending = pendingTextDocs.length > 0 || pendingFileDocs.length > 0;

  const textTab = () => (
    <Box>
      <Stack direction="row" alignItems="center" mb={2}>
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
        <TextDocEditor
          title={t("newEntry")}
          nameValue={newTextName}
          descValue={newTextDesc}
          contentValue={newTextContent}
          onNameChange={setNewTextName}
          onDescChange={setNewTextDesc}
          onContentChange={setNewTextContent}
          onSave={handleCreateTextDoc}
          onCancel={() => setIsAddingText(false)}
          saveTitle={t("addToPending")}
        />
      )}

      {isLoadingTextDocs ? (
        <LoadingSpinner />
      ) : textDocs.length === 0 &&
        pendingTextDocs.length === 0 &&
        !isAddingText ? (
        <Typography color="text.secondary">
          {t("noTextDocumentation")}
        </Typography>
      ) : (
        <Stack spacing={2}>
          {pendingTextDocs.map((doc) =>
            editingPendingTextId === doc.id ? (
              <TextDocEditor
                title={t("editPendingEntry")}
                nameValue={pendingTextEditName}
                descValue={pendingTextEditDesc}
                contentValue={pendingTextEditContent}
                onNameChange={setPendingTextEditName}
                onDescChange={setPendingTextEditDesc}
                onContentChange={setPendingTextEditContent}
                onSave={savePendingTextEdit}
                onCancel={cancelPendingTextEdit}
                saveTitle={t("save")}
              />
            ) : (
              <TextDocItem
                key={doc.id}
                name={doc.name}
                description={doc.description}
                content={doc.content}
                onEdit={() => startEditPendingText(doc)}
                onRemove={() => handleRemovePendingText(doc.id)}
                pending
              />
            ),
          )}

          {textDocs.map((doc) =>
            editingTextId === doc.id ? (
              <TextDocEditor
                title={t("editEntry")}
                nameValue={doc.name}
                descValue={editTextDesc}
                contentValue={editTextContent}
                onNameChange={() => {}}
                onDescChange={setEditTextDesc}
                onContentChange={setEditTextContent}
                onSave={() => saveEditTextDoc(doc.id)}
                onCancel={cancelEditTextDoc}
                saveTitle={t("save")}
              />
            ) : (
              <TextDocItem
                name={doc.name}
                description={doc.description}
                content={doc.content || ""}
                onEdit={() => startEditTextDoc(doc)}
                onRemove={() => requestDelete(doc.id, "text", doc.name)}
              />
            ),
          )}
        </Stack>
      )}
    </Box>
  );

  const fileTab = () => (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {t("allowedFileExtensions")}
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems="center"
        paddingBottom={2}
      >
        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={() => fileInputRef.current?.click()}
          sx={{ whiteSpace: "nowrap" }}
        >
          {t("selectFile")}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          accept={ACCEPTED_UPLOAD_FILE_TYPES}
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        <TextField
          size="small"
          fullWidth
          label={t("uploadDescriptionOptional")}
          value={uploadDesc}
          onChange={(e) => setUploadDesc(e.target.value)}
        />
      </Stack>

      {isLoadingFileDocs ? (
        <LoadingSpinner />
      ) : fileDocs.length === 0 && pendingFileDocs.length === 0 ? (
        <Typography color="text.secondary">
          {t("noFileDocumentation")}
        </Typography>
      ) : (
        <Stack spacing={2}>
          {pendingFileDocs.map((doc) => {
            const ui = getFileKindUI(doc.name);
            return editingPendingFileId === doc.id ? (
              <FileDocEditor
                icon={ui.icon}
                name={doc.name}
                description={pendingFileEditDesc}
                onDescriptionChange={setPendingFileEditDesc}
                onSave={savePendingFileEdit}
                onCancel={cancelPendingFileEdit}
                saveTitle={t("save")}
              />
            ) : (
              <FileDocItem
                name={doc.name}
                icon={ui.icon}
                description={doc.description}
                onEdit={() => startEditFileDoc(doc)}
                onRemove={() => requestDelete(doc.id, "file", doc.name)}
                chipLabel={t("pendingLabel")}
                chipColor={"warning"}
              />
            );
          })}

          {fileDocs.map((doc) => {
            const ui = getFileKindUI(doc.name);
            return editingFileId === doc.id ? (
              <FileDocEditor
                icon={ui.icon}
                name={doc.name}
                description={editFileDesc}
                onDescriptionChange={setEditFileDesc}
                onSave={() => saveEditFileDoc(doc.id)}
                onCancel={cancelEditFileDoc}
                saveTitle={t("save")}
              />
            ) : (
              <FileDocItem
                name={doc.name}
                icon={ui.icon}
                description={doc.description}
                onEdit={() => startEditFileDoc(doc)}
                onRemove={() => requestDelete(doc.id, "file", doc.name)}
                onDownload={() => handleFileDownload(doc.id, doc.name)}
                chipLabel={ui.chipLabel}
                chipColor={ui.color}
              />
            );
          })}
        </Stack>
      )}
    </Box>
  );

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            aria-label={t("documentationTabsAriaLabel")}
          >
            <Tab label={t("textDocumentationTab")} />
            <Tab label={t("fileDocumentationTab")} />
          </Tabs>
        </Box>
        {hasPending && onSavePending && (
          <Button
            variant="contained"
            color="primary"
            startIcon={
              isSavingPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
            onClick={onSavePending}
            disabled={isSavingPending}
          >
            {t("saveAllPending")} (
            {pendingTextDocs.length + pendingFileDocs.length})
          </Button>
        )}
      </Stack>

      {tabIndex === 0 && textTab()}

      {tabIndex === 1 && fileTab()}

      {/* Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={closeDeleteConfirm}>
        <DialogTitle>{t("confirmDeletionTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("confirmDeletionMessagePrefix")} &quot;{itemToDelete?.name}
            &quot;? {t("confirmDeletionMessageSuffix")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm} color="primary">
            {t("cancel")}
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={isDeletingText || isDeletingFile}
          >
            {isDeletingText || isDeletingFile ? (
              <CircularProgress size={20} />
            ) : (
              t("delete")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
