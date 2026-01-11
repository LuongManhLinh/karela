"use client";
import React from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
} from "@mui/material";
import { useACStore } from "@/store/useACStore";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

const SuggestionPanel = ({
  onApply,
}: {
  onApply: (content: string) => void;
}) => {
  const { suggestions, loading } = useACStore();

  if (suggestions.length === 0) return null;

  return (
    <Paper
      sx={{
        p: 2,
        mt: 2,
        mb: 2,
        border: "1px solid #cce5ff",
        backgroundColor: "#f0f7ff",
      }}
    >
      <Box display="flex" alignItems="center" mb={1}>
        <AutoAwesomeIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="subtitle2" color="primary">
          AI Suggestions
        </Typography>
      </Box>
      <List dense>
        {suggestions.map((suggestion, index) => (
          <ListItem key={index} disablePadding sx={{ display: "block", mb: 1 }}>
            <Paper
              variant="outlined"
              sx={{ p: 1, borderColor: "primary.main", borderStyle: "dashed" }}
            >
              <Typography
                variant="body2"
                component="pre"
                sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace", mb: 1 }}
              >
                {suggestion.new_content}
              </Typography>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="caption" color="text.secondary">
                  {suggestion.explanation}
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => onApply(suggestion.new_content)}
                >
                  Apply
                </Button>
              </Box>
            </Paper>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default SuggestionPanel;
