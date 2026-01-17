"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { StoryDto } from "@/types/integration";
import StoryChip from "./StoryChip";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { connectionService } from "@/services/connectionService";

interface MultiStoryDetailDialogProps {
  open: boolean;
  onClose: () => void;
  connectionId: string;
  projectKey: string;
  storyKeys: string[];
}

export const MultiStoryDetailDialog: React.FC<MultiStoryDetailDialogProps> = ({
  open,
  onClose,
  connectionId,
  projectKey,
  storyKeys,
}) => {
  const [stories, setStories] = useState<StoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || storyKeys.length === 0 || !connectionId || !projectKey) {
      return;
    }

    const fetchStories = async () => {
      setLoading(true);
      setError(null);
      try {
        const storyPromises = storyKeys.map((key) =>
          connectionService.getStory(connectionId, projectKey, key)
        );
        const responses = await Promise.all(storyPromises);
        const loadedStories = responses
          .filter((res) => res.data)
          .map((res) => res.data as StoryDto);
        setStories(loadedStories);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load story details");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [open, storyKeys, connectionId, projectKey]);

  const handleClose = () => {
    setStories([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{ ...scrollBarSx }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Story Details</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : stories.length > 0 ? (
          <Stack spacing={2}>
            {stories.map((story) => (
              <Card key={story.id} variant="outlined">
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <StoryChip
                      storyKey={story.key}
                      size="medium"
                      clickable={false}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Summary
                    </Typography>
                    <Typography variant="body1">
                      {story.summary || "No summary"}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                      {story.description || "No description"}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">No stories found</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MultiStoryDetailDialog;
