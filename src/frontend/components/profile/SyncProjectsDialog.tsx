import { useProjectsSyncQuery } from "@/hooks/queries/useConnectionQueries";
import { connectionService } from "@/services/connectionService";
import { ConnectionDto, ProjectDtoSync } from "@/types/connection";
import CloseIcon from "@mui/icons-material/Close";
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
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
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";

export interface SyncProjectsDialogProps {
  open: boolean;
  connection: ConnectionDto;
  onClose: () => void;
}

interface ProjectSyncItemProps {
  project: ProjectDtoSync;
  selected: boolean;
  onToggle: (key: string) => void;
}

const ProjectSyncItem: React.FC<ProjectSyncItemProps> = ({
  project,
  selected,
  onToggle,
}) => {
  const isSynced = project.synced;

  return (
    <ListItem disablePadding>
      <ListItemButton
        dense
        disabled={isSynced}
        onClick={() => !isSynced && onToggle(project.key)}
        sx={{ borderRadius: 1 }}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          {isSynced ? (
            <Tooltip title="Already synced">
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
                  — {project.name}
                </Typography>
              )}
            </Box>
          }
          secondary={
            isSynced ? (
              <Typography variant="caption" color="success.main">
                Synced
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Not synced
              </Typography>
            )
          }
        />
      </ListItemButton>
    </ListItem>
  );
};

export const SyncProjectsDialog: React.FC<SyncProjectsDialogProps> = ({
  open,
  connection,
  onClose,
}) => {
  const { data, isLoading } = useProjectsSyncQuery(connection.id);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [runAnalysisAfterSync, setRunAnalysisAfterSync] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const syncStatuses: ProjectDtoSync[] = useMemo(() => {
    return data?.data || [];
  }, [data]);

  const unsyncedProjects = useMemo(
    () => syncStatuses.filter((p) => !p.synced),
    [syncStatuses],
  );

  const syncedProjects = useMemo(
    () => syncStatuses.filter((p) => p.synced),
    [syncStatuses],
  );

  const handleToggle = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedKeys.size === unsyncedProjects.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(unsyncedProjects.map((p) => p.key)));
    }
  }, [selectedKeys.size, unsyncedProjects]);

  const handleSync = async () => {
    if (selectedKeys.size === 0) return;
    setIsSyncing(true);
    try {
      await connectionService.syncProjects(
        connection.id,
        Array.from(selectedKeys),
        runAnalysisAfterSync,
      );
      onClose();
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
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SyncIcon fontSize="small" />
          <Typography variant="h6" component="span">
            Sync Projects
          </Typography>
        </Box>
        <IconButton edge="end" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
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
              No projects found for this connection.
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
                  <Typography variant="subtitle2" color="text.secondary">
                    Available to sync ({unsyncedProjects.length})
                  </Typography>
                  <Button size="small" onClick={handleSelectAll}>
                    {allSelected ? "Deselect all" : "Select all"}
                  </Button>
                </Box>
                <List dense sx={{ px: 1 }}>
                  {unsyncedProjects.map((project) => (
                    <ProjectSyncItem
                      key={project.id}
                      project={project}
                      selected={selectedKeys.has(project.key)}
                      onToggle={handleToggle}
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
                    Already synced ({syncedProjects.length})
                  </Typography>
                </Box>
                <List dense sx={{ px: 1, opacity: 0.7 }}>
                  {syncedProjects.map((project) => (
                    <ProjectSyncItem
                      key={project.id}
                      project={project}
                      selected={false}
                      onToggle={handleToggle}
                    />
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, justifyContent: "space-between" }}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={runAnalysisAfterSync}
              onChange={(_, checked) => setRunAnalysisAfterSync(checked)}
            />
          }
          label={
            <Typography variant="body2">Run analysis after sync</Typography>
          }
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose} size="small">
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleSync}
            disabled={selectedKeys.size === 0 || isSyncing}
            startIcon={
              isSyncing ? <CircularProgress size={16} /> : <SyncIcon />
            }
          >
            {isSyncing
              ? "Syncing..."
              : `Sync${selectedKeys.size > 0 ? ` (${selectedKeys.size})` : ""}`}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
