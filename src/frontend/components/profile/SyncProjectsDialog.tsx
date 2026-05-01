import { connectionService } from "@/services/connectionService";
import { documentationService } from "@/services/documentationService";
import { ProjectSyncDto, SyncProject } from "@/types/connection";
import CloseIcon from "@mui/icons-material/Close";
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { scrollBarSx } from "@/constants/scrollBarSx";
import {
  DocumentationManager,
  PendingTextDoc,
  PendingFileDoc,
} from "@/components/documentation/DocumentationManager";
import { DialogContentText } from "@mui/material";
import { useBulkUploadDocsMutation } from "@/hooks/queries/useDocumentationQueries";
import { useQueryClient } from "@tanstack/react-query";

export interface SyncProjectsDialogProps {
  open: boolean;
  isLoading: boolean;
  syncStatuses: ProjectSyncDto[];
  syncedProjectsCount: number;
  totalProjectsCount: number;
  onClose: () => void;
}

interface ProjectSyncItemProps {
  project: ProjectSyncDto;
  selected: boolean;
  hasConfig: boolean;
  onToggle: (key: string) => void;
  onConfigure: (key: string) => void;
}

const ProjectSyncItem: React.FC<ProjectSyncItemProps> = ({
  project,
  selected,
  hasConfig,
  onToggle,
  onConfigure,
}) => {
  const isSynced = project.synced;

  const t = useTranslations("profile.SyncProjectsDialog");

  return (
    <ListItem
      disablePadding
      secondaryAction={
        selected && !isSynced ? (
          <Tooltip
            title={hasConfig ? t("editConfiguration") : t("configureProject")}
          >
            <IconButton
              edge="end"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure(project.key);
              }}
              color={hasConfig ? "default" : "warning"}
            >
              {hasConfig ? <SettingsIcon /> : <WarningIcon />}
            </IconButton>
          </Tooltip>
        ) : undefined
      }
    >
      <ListItemButton
        dense
        disabled={isSynced}
        onClick={() => !isSynced && onToggle(project.key)}
        sx={{ borderRadius: 1 }}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          {isSynced ? (
            <Tooltip title={t("alreadySynced")}>
              <CheckCircleIcon color="success" fontSize="small" />
            </Tooltip>
          ) : (
            <Checkbox
              edge="start"
              checked={selected}
              tabIndex={-1}
              disableRipple
              size="small"
            />
          )}
        </ListItemIcon>
        <ListItemAvatar sx={{ minWidth: 40 }}>
          <Avatar
            src={project.avatar_url}
            alt={project.name || project.key}
            sx={{ width: 28, height: 28, fontSize: 14 }}
          >
            {(project.name || project.key).charAt(0)}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                {project.key}
              </Typography>
              {project.name && (
                <Typography variant="body2" color="text.secondary">
                  - {project.name}
                </Typography>
              )}
            </Box>
          }
          secondary={
            isSynced ? (
              <Typography variant="caption" color="success.main">
                {t("synced")}
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary">
                {t("notSynced")}
              </Typography>
            )
          }
        />
      </ListItemButton>
    </ListItem>
  );
};

interface ProjectConfig {
  description: string;
  run_analysis_after_sync: boolean;
}

const ProjectConfigDialog = ({
  open,
  projectKey,
  initialConfig,
  onSave,
  onClose,
}: {
  open: boolean;
  projectKey: string;
  initialConfig?: ProjectConfig;
  onSave: (config: ProjectConfig) => void;
  onClose: () => void;
}) => {
  const t = useTranslations("profile.SyncProjectsDialog");
  const [context, setContext] = useState("");
  const [runAnalysis, setRunAnalysis] = useState(false);
  const [pendingTextDocs, setPendingTextDocs] = useState<PendingTextDoc[]>([]);
  const [pendingFileDocs, setPendingFileDocs] = useState<PendingFileDoc[]>([]);
  const { mutateAsync: bulkUploadDocs, isPending: isSavingDocs } =
    useBulkUploadDocsMutation(projectKey);

  useEffect(() => {
    if (open) {
      setContext(initialConfig?.description || "");
      setRunAnalysis(initialConfig?.run_analysis_after_sync || false);
      setPendingTextDocs([]);
      setPendingFileDocs([]);
    }
  }, [open, initialConfig]);

  const handleSave = async () => {
    if (pendingTextDocs.length > 0 || pendingFileDocs.length > 0) {
      try {
        await bulkUploadDocs({
          textDocs: pendingTextDocs.map((d) => ({
            name: d.name,
            content: d.content,
            description: d.description,
          })),
          fileDocs: pendingFileDocs.map((d) => ({
            file: d.file,
            description: d.description,
          })),
        });
        setPendingTextDocs([]);
        setPendingFileDocs([]);
      } catch (e: any) {
        return; // Error notified by mutation, prevent close
      }
    }
    onSave({ description: context, run_analysis_after_sync: runAnalysis });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {t("projectConfiguration")} - {projectKey}
        <IconButton edge="end" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ ...scrollBarSx }}>
        <Typography variant="h6" gutterBottom>
          {t("projectDescription")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("projectDescriptionHelper")}
        </Typography>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          maxRows={8}
          label={t("projectDescription")}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder={t("projectDescriptionPlaceholder")}
          sx={{
            ...scrollBarSx,
          }}
          required
        />

        <Box sx={{ my: 6 }} />

        {open && projectKey && (
          <>
            <Typography variant="h6" gutterBottom>
              {t("projectDocumentation")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("projectDocumentationHelper")}
            </Typography>
            <DocumentationManager
              projectKey={projectKey}
              pendingTextDocs={pendingTextDocs}
              setPendingTextDocs={setPendingTextDocs}
              pendingFileDocs={pendingFileDocs}
              setPendingFileDocs={setPendingFileDocs}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <FormControlLabel
          control={
            <Switch
              checked={runAnalysis}
              onChange={(e) => setRunAnalysis(e.target.checked)}
            />
          }
          label={t("runAnalysisAfterSync")}
        />

        <Button onClick={onClose}>{t("cancel")}</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!context.trim() || isSavingDocs}
          startIcon={isSavingDocs ? <CircularProgress size={16} /> : null}
        >
          {isSavingDocs ? t("save") + "..." : t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const SyncProjectsDialog: React.FC<SyncProjectsDialogProps> = ({
  open,
  isLoading,
  syncStatuses,
  syncedProjectsCount,
  totalProjectsCount,
  onClose,
}) => {
  const t = useTranslations("profile.SyncProjectsDialog");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [configs, setConfigs] = useState<Record<string, ProjectConfig>>({});
  const [configDialogOpenFor, setConfigDialogOpenFor] = useState<string | null>(
    null,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [confirmSyncDialogOpen, setConfirmSyncDialogOpen] = useState(false);
  const [projectsMissingDocs, setProjectsMissingDocs] = useState<string[]>([]);

  const queryClient = useQueryClient();

  const unsyncedProjects = useMemo(
    () => syncStatuses.filter((p) => !p.synced),
    [syncStatuses],
  );

  const syncedProjects = useMemo(
    () => syncStatuses.filter((p) => p.synced),
    [syncStatuses],
  );

  const handleToggle = useCallback(
    (key: string) => {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });

      if (!selectedKeys.has(key) && !configs[key]?.description) {
        setConfigDialogOpenFor(key);
      }
    },
    [selectedKeys, configs],
  );

  const handleSelectAll = useCallback(() => {
    if (selectedKeys.size === unsyncedProjects.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(unsyncedProjects.map((p) => p.key)));
    }
  }, [selectedKeys.size, unsyncedProjects]);

  const handleSyncClick = async () => {
    if (selectedKeys.size === 0) return;

    const missingContextKeys = Array.from(selectedKeys).filter(
      (key) => !configs[key]?.description?.trim(),
    );

    if (missingContextKeys.length > 0) {
      setConfigDialogOpenFor(missingContextKeys[0]);
      return;
    }

    setIsValidating(true);
    try {
      const missingDocs: string[] = [];
      const keysToSync = Array.from(selectedKeys);

      await Promise.all(
        keysToSync.map(async (key) => {
          const [textDocsResp, fileDocsResp] = await Promise.all([
            documentationService.listTextDocs(key),
            documentationService.listFileDocs(key),
          ]);

          const hasTextDocs = textDocsResp.data && textDocsResp.data.length > 0;
          const hasFileDocs = fileDocsResp.data && fileDocsResp.data.length > 0;

          if (!hasTextDocs && !hasFileDocs) {
            missingDocs.push(key);
          }
        }),
      );

      if (missingDocs.length > 0) {
        setProjectsMissingDocs(missingDocs);
        setConfirmSyncDialogOpen(true);
      } else {
        await executeSync();
      }
    } catch (e) {
      // If validation fails, proceed to sync anyway or handle error
      console.error("Validation failed", e);
      await executeSync();
    } finally {
      setIsValidating(false);
    }
  };

  const executeSync = async () => {
    setIsSyncing(true);
    setConfirmSyncDialogOpen(false);
    try {
      const projectsToSync: SyncProject[] = Array.from(selectedKeys).map(
        (key) => ({
          key,
          description: configs[key].description,
          run_analysis_after_sync: configs[key].run_analysis_after_sync,
        }),
      );
      onClose();
      await connectionService.syncProjects(projectsToSync);
      queryClient.invalidateQueries({ queryKey: ["connections", "projects"] });
    } finally {
      setIsSyncing(false);
    }
  };

  const allSelected =
    unsyncedProjects.length > 0 &&
    selectedKeys.size === unsyncedProjects.length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SyncIcon fontSize="small" />
          <Typography variant="h6" component="span">
            {t("title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            {t("syncedCount", {
              synced: syncedProjectsCount,
              total: totalProjectsCount,
            })}
          </Typography>
        </Box>
        <IconButton edge="end" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, ...scrollBarSx }}>
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 6,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : syncStatuses.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              {t("noProjectsFound")}
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Unsynced projects section */}
            {unsyncedProjects.length > 0 && (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    pt: 1.5,
                    pb: 0.5,
                  }}
                >
                  <Button size="small" onClick={handleSelectAll}>
                    {allSelected ? t("deselectAll") : t("selectAll")}
                  </Button>
                </Box>
                <List dense sx={{ px: 1 }}>
                  {unsyncedProjects.map((project) => (
                    <ProjectSyncItem
                      key={project.id}
                      project={project}
                      selected={selectedKeys.has(project.key)}
                      hasConfig={!!configs[project.key]?.description}
                      onToggle={handleToggle}
                      onConfigure={(key) => setConfigDialogOpenFor(key)}
                    />
                  ))}
                </List>
              </Box>
            )}

            {/* Synced projects section */}
            {syncedProjects.length > 0 && (
              <Box>
                <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t("alreadySynced", { count: syncedProjectsCount })}
                  </Typography>
                </Box>
                <List dense sx={{ px: 1, opacity: 0.7 }}>
                  {syncedProjects.map((project) => (
                    <ProjectSyncItem
                      key={project.id}
                      project={project}
                      selected={false}
                      hasConfig={false}
                      onToggle={handleToggle}
                      onConfigure={() => {}}
                    />
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, justifyContent: "flex-end" }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose} size="small">
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleSyncClick}
            disabled={selectedKeys.size === 0 || isSyncing || isValidating}
            startIcon={
              isSyncing || isValidating ? (
                <CircularProgress size={16} />
              ) : (
                <SyncIcon />
              )
            }
          >
            {isSyncing || isValidating
              ? t("syncing")
              : t("sync", { count: selectedKeys.size })}
          </Button>
        </Box>
      </DialogActions>

      <ProjectConfigDialog
        open={!!configDialogOpenFor}
        projectKey={configDialogOpenFor || ""}
        initialConfig={
          configDialogOpenFor ? configs[configDialogOpenFor] : undefined
        }
        onSave={(config) => {
          if (configDialogOpenFor) {
            setConfigs((prev) => ({ ...prev, [configDialogOpenFor]: config }));
            setConfigDialogOpenFor(null);
          }
        }}
        onClose={() => setConfigDialogOpenFor(null)}
      />

      {/* Confirmation Dialog for missing documentation */}
      <Dialog
        open={confirmSyncDialogOpen}
        onClose={() => !isSyncing && setConfirmSyncDialogOpen(false)}
      >
        <DialogTitle>{t("missingDocumentationTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("missingDocumentationMessage")}
          </DialogContentText>
          <List dense>
            {projectsMissingDocs.map((key) => (
              <ListItem key={key} sx={{ display: "list-item" }}>
                <Typography variant="body2" fontWeight="bold">
                  {key}
                </Typography>
              </ListItem>
            ))}
          </List>
          <DialogContentText sx={{ mt: 2 }}>
            {t("missingDocumentationConfirmation")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmSyncDialogOpen(false)}
            disabled={isSyncing}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={executeSync}
            variant="contained"
            color="warning"
            disabled={isSyncing}
            startIcon={
              isSyncing ? <CircularProgress size={16} /> : <SyncIcon />
            }
          >
            {isSyncing ? t("syncing") : t("continueSync")}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};
