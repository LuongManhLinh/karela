import { ConnectionDto, ProjectDto, StorySummary } from "@/types/connection";
import { SelectableOptions, SessionStartForm } from "./SessionStartForm";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";

export interface SessionStartDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  connectionOptions: SelectableOptions<ConnectionDto>;
  projectOptions: SelectableOptions<ProjectDto>;
  storyOptions: SelectableOptions<StorySummary>;
  onPrimarySubmit?: (
    connection: ConnectionDto,
    project: ProjectDto,
    story: StorySummary,
  ) => void;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  onSecondarySubmit?: (
    connection: ConnectionDto,
    project: ProjectDto,
    story: StorySummary,
  ) => void;
  secondaryLabel?: string;
  secondaryDisabled?: boolean;
}

export const SessionStartDialog: React.FC<SessionStartDialogProps> = ({
  open,
  onClose,
  title,
  connectionOptions,
  projectOptions,
  storyOptions,
  onPrimarySubmit,
  primaryLabel,
  primaryDisabled,
  onSecondarySubmit,
  secondaryLabel,
  secondaryDisabled,
}) => {
  const [connection, setConnection] = useState<ConnectionDto | null>(null);
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [story, setStory] = useState<StorySummary | null>(null);

  useEffect(() => {
    setConnection(connectionOptions.selectedOption);
  }, [connectionOptions.selectedOption]);

  useEffect(() => {
    setProject(projectOptions.selectedOption);
  }, [projectOptions.selectedOption]);

  useEffect(() => {
    setStory(storyOptions.selectedOption);
  }, [storyOptions.selectedOption]);

  const handleConnectionChange = (value: ConnectionDto | null) => {
    setConnection(value);
  };

  const handleProjectChange = (value: ProjectDto | null) => {
    setProject(value);
  };

  const handleStoryChange = (value: StorySummary | null) => {
    setStory(value);
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {title}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <SessionStartForm
          connectionOptions={{
            options: connectionOptions.options,
            selectedOption: connection,
            onChange: handleConnectionChange,
          }}
          projectOptions={{
            options: projectOptions.options,
            selectedOption: project,
            onChange: handleProjectChange,
          }}
          storyOptions={{
            options: storyOptions.options,
            selectedOption: story,
            onChange: handleStoryChange,
          }}
          primaryAction={{
            label: primaryLabel || "Start Session",
            onClick: () => {
              if (onPrimarySubmit && connection && project && story) {
                onPrimarySubmit(connection, project, story);
              }
            },
            disabled: primaryDisabled || !connection || !project || !story,
          }}
          secondaryAction={
            onSecondarySubmit
              ? {
                  label: secondaryLabel || "Optional Action",
                  onClick: () => {
                    if (onSecondarySubmit && connection && project && story) {
                      onSecondarySubmit(connection, project, story);
                    }
                  },
                  disabled: secondaryDisabled || !connection || !project,
                }
              : undefined
          }
        />
      </DialogContent>
    </Dialog>
  );
};
