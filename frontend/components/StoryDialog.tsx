"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { useStoryDetailsQuery } from "@/hooks/queries/useConnectionQueries";
import { useStoryByACQuery } from "@/hooks/queries/useACQueries";

export interface StoryDialogProps {
  open: boolean;
  onClose: () => void;
  story: StoryDto | null;
  loading: boolean;
  error: any;
}
export const StoryDialog: React.FC<StoryDialogProps> = ({
  open,
  onClose,
  story,
  loading,
  error,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">
          Story Details {story && `- ${story.key}`}
        </Typography>
        <IconButton onClick={onClose} size="small">
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
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

interface StoryDetailDialogProps {
  open: boolean;
  onClose: () => void;
  connectionName: string;
  projectKey: string;
  storyKey: string;
}

export const StoryDetailDialog: React.FC<StoryDetailDialogProps> = ({
  open,
  onClose,
  connectionName,
  projectKey,
  storyKey,
}) => {
  const {
    data: storyData,
    isLoading: loading,
    error,
  } = useStoryDetailsQuery(connectionName, projectKey, storyKey!);

  const story = useMemo(() => {
    return storyData?.data || null;
  }, [storyData]);

  return (
    <StoryDialog
      open={open}
      onClose={onClose}
      story={story}
      loading={loading}
      error={error}
    />
  );
};

export interface StoryByACDialogProps {
  open: boolean;
  onClose: () => void;
  acId: string;
}

export const StoryByACDialog: React.FC<StoryByACDialogProps> = ({
  open,
  onClose,
  acId,
}) => {
  const {
    data: storyData,
    isLoading: loading,
    error,
  } = useStoryByACQuery(acId);

  const story = useMemo(() => {
    return storyData?.data || null;
  }, [storyData]);

  return (
    <StoryDialog
      open={open}
      onClose={onClose}
      story={story}
      loading={loading}
      error={error}
    />
  );
};

export default StoryDetailDialog;
