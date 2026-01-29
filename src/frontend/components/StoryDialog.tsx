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
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { StoryDto } from "@/types/connection";
import { useStoryDetailsQuery } from "@/hooks/queries/useConnectionQueries";
import { useStoryByACQuery } from "@/hooks/queries/useACQueries";
import StoryChip from "./StoryChip";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { connectionService } from "@/services/connectionService";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("StoryDialog");

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
          {t("title")} {story && `- ${story.key}`}
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
                {t("summary")}
              </Typography>
              <Typography variant="body1">
                {story.summary || t("noSummary")}
              </Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t("description")}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                {story.description || t("noDescription")}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography color="text.secondary">{t("noStorySelected")}</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("close")}</Button>
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

interface MultiStoryDetailDialogProps {
  open: boolean;
  onClose: () => void;
  connectionName: string;
  storyKeys: string[];
}

export const MultiStoryDetailDialog: React.FC<MultiStoryDetailDialogProps> = ({
  open,
  onClose,
  connectionName,
  storyKeys,
}) => {
  const [stories, setStories] = useState<StoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations("StoryDialog");

  useEffect(() => {
    if (!open || storyKeys.length === 0) {
      return;
    }

    const fetchStories = async () => {
      setLoading(true);
      setError(null);
      try {
        const storyPromises = storyKeys.map((key) =>
          connectionService.getStory(connectionName, key),
        );
        const responses = await Promise.all(storyPromises);
        const loadedStories = responses
          .filter((res) => res.data)
          .map((res) => res.data as StoryDto);
        setStories(loadedStories);
      } catch (err: any) {
        setError(err.response?.data?.detail || t("failedToLoadStoryDetails"));
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [open, connectionName, storyKeys, t]);

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
        <Typography variant="h6">{t("title")}</Typography>
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
                      {t("summary")}
                    </Typography>
                    <Typography variant="body1">
                      {story.summary || t("noSummary")}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t("description")}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                      {story.description || t("noDescription")}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">{t("noStoriesFound")}</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};
