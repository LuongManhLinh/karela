"use client";

import React from "react";
import {
  Paper,
  TextField,
  Button,
  Box,
  MenuItem,
  Autocomplete,
  Typography,
  Stack,
} from "@mui/material";
import { LoadingSpinner } from "./LoadingSpinner";
import type { JiraConnectionDto } from "@/types/integration";
import Link from "next/link";

interface SessionStartFormProps {
  selectedConnection: JiraConnectionDto | null;
  connections: JiraConnectionDto[];
  onConnectionChange: (connection: JiraConnectionDto) => void;
  selectedProjectKey: string | null;
  projectKeys: string[];
  onProjectKeyChange: (projectKey: string) => void;
  selectedStoryKey?: string | null;
  storyKeys: string[];
  onStoryKeyChange: (storyKey: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  submitLabel?: string;
}

export const SessionStartForm: React.FC<SessionStartFormProps> = ({
  selectedConnection,
  connections,
  onConnectionChange,
  selectedProjectKey,
  projectKeys,
  onProjectKeyChange,
  selectedStoryKey,
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
      <Autocomplete
        fullWidth
        options={connections}
        value={
          connections.find((conn) => conn.id === selectedConnection?.id) || null
        }
        onChange={(event, newValue) => {
          if (newValue) {
            onConnectionChange(newValue);
          }
        }}
        getOptionLabel={(option) => option.name || option.id}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        disabled={loading}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Connection"
            required
            margin="normal"
            InputProps={{
              ...params.InputProps,
              startAdornment: selectedConnection ? (
                <Box
                  component="img"
                  src={selectedConnection.avatar_url}
                  alt="icon"
                  sx={{ width: 20, height: 20, mx: 1 }}
                />
              ) : null,
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <img
                src={option.avatar_url}
                alt="icon"
                style={{ width: 20, height: 20, marginRight: 10 }}
              />
              {option.name || option.id}
            </Box>
          </li>
        )}
        filterOptions={(options, { inputValue }) => {
          if (!inputValue) return options;
          const searchValue = inputValue.toLowerCase();
          return options.filter((option) => {
            const label = (option.name || option.id).toLowerCase();
            return label.startsWith(searchValue);
          });
        }}
      />
      <Autocomplete
        fullWidth
        options={projectKeys}
        value={selectedProjectKey || null}
        onChange={(event, newValue) => {
          onProjectKeyChange(newValue || "");
        }}
        disabled={loading}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Project Key"
            required
            margin="normal"
            sx={{ minWidth: 120 }}
          />
        )}
        filterOptions={(options, { inputValue }) => {
          if (!inputValue) return options;
          const searchValue = inputValue.toLowerCase();
          return options.filter((key) =>
            key.toLowerCase().startsWith(searchValue)
          );
        }}
      />
      <Autocomplete
        fullWidth
        options={storyKeys}
        value={selectedStoryKey || null}
        onChange={(event, newValue) => {
          onStoryKeyChange(newValue || "");
        }}
        disabled={loading}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Story Key (Optional)"
            margin="normal"
            sx={{ minWidth: 150 }}
          />
        )}
        filterOptions={(options, { inputValue }) => {
          if (!inputValue) return options;
          const searchValue = inputValue.toLowerCase();
          return options.filter((key) =>
            key.toLowerCase().startsWith(searchValue)
          );
        }}
      />
      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
        disabled={loading || !selectedConnection || !selectedProjectKey}
        onClick={onSubmit}
      >
        {loading ? <LoadingSpinner size={24} /> : submitLabel || "Submit"}
      </Button>
    </Box>
  );
};
