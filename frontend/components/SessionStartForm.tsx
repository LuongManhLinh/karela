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
  onSubmit: (data: {
    connectionId: string;
    projectKey: string;
    storyKey?: string;
    userMessage?: string;
  }) => void;
  onConnectionChange?: (connectionId: string) => void;
  loading?: boolean;
  submitLabel?: string;
  showMessageField?: boolean;
}

export const SessionStartForm: React.FC<SessionStartFormProps> = ({
  onSubmit,
  onConnectionChange,
  loading = false,
  submitLabel = "Start",
  showMessageField = false,
}) => {
  const [connections, setConnections] = useState<JiraConnectionDto[]>([]);
  const [connectionId, setConnectionId] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [storyKey, setStoryKey] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [loadingConnections, setLoadingConnections] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  const router = useRouter();

  const loadConnections = async () => {
    try {
      const response = await userService.getUserConnections();
      if (response.data) {
        const jiraConnections = response.data.jira_connections || [];
        setConnections(jiraConnections);
        if (jiraConnections.length > 0) {
          const firstId = jiraConnections[0].id;
          setConnectionId(firstId);
          if (onConnectionChange) {
            onConnectionChange(firstId);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load connections:", err);
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (connectionId && projectKey) {
      onSubmit({
        connectionId,
        projectKey,
        storyKey: storyKey || undefined,
        userMessage: showMessageField ? userMessage || undefined : undefined,
      });
    }
  };

  if (loadingConnections) {
    return <LoadingSpinner />;
  }

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
    <Box component="form" onSubmit={handleSubmit}>
      <FormControl fullWidth margin="normal" required>
        <InputLabel>Connection</InputLabel>
        <Select
          value={connectionId}
          onChange={(e) => {
            setConnectionId(e.target.value);
            console.log("Selected connection ID:", e.target.value);
            if (onConnectionChange) {
              onConnectionChange(e.target.value);
            }
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
      <TextField
        fullWidth
        margin="normal"
        required
        label="Project Key"
        value={projectKey}
        onChange={(e) => setProjectKey(e.target.value)}
        disabled={loading}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Story Key (Optional)"
        value={storyKey}
        onChange={(e) => setStoryKey(e.target.value)}
        disabled={loading}
      />
      {showMessageField && (
        <TextField
          fullWidth
          margin="normal"
          label="Initial Message"
          multiline
          rows={3}
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          disabled={loading}
          placeholder="Enter your initial message to start the chat..."
        />
      )}
      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
        disabled={loading || !connectionId || !projectKey}
      >
        {loading ? <LoadingSpinner size={24} /> : submitLabel}
      </Button>
    </Box>
  );
};
