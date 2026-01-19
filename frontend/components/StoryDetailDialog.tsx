"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Divider,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { StoryDto } from "@/types/connection";
import { userService } from "@/services/userService";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

interface StoryDetailDialogProps {
  open: boolean;
  onClose: () => void;
  storyKey: string | null;
}

export const StoryDetailDialog: React.FC<StoryDetailDialogProps> = ({
  open,
  onClose,
  storyKey,
}) => {
  const {
    selectedConnection: selectedConnectionId,
    selectedProject: selectedProjectKey,
  } = useWorkspaceStore();
  const [story, setStory] = useState<StoryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !storyKey || !selectedConnectionId || !selectedProjectKey) {
      return;
    }

    const fetchStory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await userService.getStory(
          selectedConnectionId,
          selectedProjectKey,
          storyKey,
        );
        if (response.data) {
          setStory(response.data);
        } else {
          setError("Failed to load story details");
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load story details");
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [open, storyKey, selectedConnectionId, selectedProjectKey]);

  const handleClose = () => {
    setStory(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">
          Story Details {storyKey && `- ${storyKey}`}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : story ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Key
              </Typography>
              <Typography variant="body1">{story.key}</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Summary
              </Typography>
              <Typography variant="body1">
                {story.summary || "No summary"}
              </Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                {story.description || "No description"}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography color="text.secondary">No story selected</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StoryDetailDialog;
