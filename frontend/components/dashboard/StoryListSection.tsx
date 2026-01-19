"use client";

import React from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  useTheme,
} from "@mui/material";
import type { StorySummary } from "@/types/connection";
import { scrollBarSx } from "@/constants/scrollBarSx";

export interface StoryListSectionProps {
  title: string;
  stories: StorySummary[];
  emptyText?: string;
  onStoryClick?: (story: StorySummary) => void;
  maxHeight?: number | string;
}

export const StoryListSection: React.FC<StoryListSectionProps> = ({
  title,
  stories,
  emptyText = "No stories",
  onStoryClick,
  maxHeight = 200,
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 1,
        bgcolor: "tertiary.main",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} color="text.primary">
          {title}
        </Typography>
        <Chip
          label={stories.length}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>

      {stories.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexGrow: 1,
            py: 3,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {emptyText}
          </Typography>
        </Box>
      ) : (
        <List
          dense
          sx={{
            maxHeight: maxHeight,
            overflow: "auto",
            ...scrollBarSx,
          }}
        >
          {stories.map((story) => (
            <ListItem key={story.id} disablePadding>
              <ListItemButton
                onClick={() => onStoryClick?.(story)}
                sx={{
                  borderRadius: 1,
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={500}>
                      {story.key}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {story.summary || "No summary"}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};
