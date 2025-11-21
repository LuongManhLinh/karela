"use client";

import React, { useState, useEffect } from "react";
import {
  Paper,
  TextField,
  Button,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Stack,
} from "@mui/material";
import { userService } from "@/services/userService";
import { LoadingSpinner } from "./LoadingSpinner";
import type { JiraConnectionDto } from "@/types";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SessionStartFormProps {
  connectionId: string;
  connections: JiraConnectionDto[];
  onConnectionChange: (connectionId: string) => void;
  projectKey: string;
  projectKeys: string[];
  onProjectKeyChange: (projectKey: string) => void;
  storyKey?: string;
  storyKeys: string[];
  onStoryKeyChange: (storyKey: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  submitLabel?: string;
}

export const SessionStartForm: React.FC<SessionStartFormProps> = ({
  connectionId,
  connections,
  onConnectionChange,
  projectKey,
  projectKeys,
  onProjectKeyChange,
  storyKey,
  storyKeys,
  onStoryKeyChange,
  onSubmit,
  loading,
  submitLabel,
}) => {
  if (connections.length === 0) {
    // No connnections available, add a link to /profile to set up connections
    return (
      <Paper
        elevation={1}
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h6" color="red" gutterBottom>
          No Connections Available
        </Typography>
        <Link
          href="/profile"
          style={{ color: "white", textDecoration: "underline" }}
        >
          Set up connection
        </Link>
      </Paper>
    );
  }

  return (
    <Box>
      <FormControl fullWidth margin="normal" required>
        <InputLabel>Connection</InputLabel>
        <Select
          value={connectionId}
          onChange={(e) => {
            onConnectionChange(e.target.value);
          }}
          label="Connection"
          disabled={loading}
        >
          {connections.map((conn) => (
            <MenuItem value={conn.id} key={conn.id}>
              <Box sx={{ display: "flex", alignItems: "center", px: 1 }}>
                {/* Example 1: Using a local image */}
                <img
                  src={conn.avatar_url}
                  alt="icon"
                  style={{ width: 20, height: 20, marginRight: 10 }}
                />
                {conn.name || conn.id}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal" required sx={{ minWidth: 120 }}>
        <InputLabel>Project Key</InputLabel>
        <Select
          value={projectKey}
          onChange={(e) => onProjectKeyChange(e.target.value)}
          label="Project Key"
          disabled={loading}
        >
          {projectKeys.map((key) => (
            <MenuItem value={key} key={key}>
              {key}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal" sx={{ minWidth: 150 }}>
        <InputLabel>Story Key (Optional)</InputLabel>
        <Select
          value={storyKey || ""}
          onChange={(e) => onStoryKeyChange(e.target.value)}
          label="Story Key (Optional)"
          disabled={loading}
        >
          {storyKeys.map((key) => (
            <MenuItem value={key} key={key}>
              {key}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
        disabled={loading || !connectionId || !projectKey}
        onClick={onSubmit}
      >
        {loading ? <LoadingSpinner size={24} /> : submitLabel}
      </Button>
    </Box>
  );
};
