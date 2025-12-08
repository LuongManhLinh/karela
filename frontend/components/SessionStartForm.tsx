"use client";

import React from "react";
import {
  TextField,
  Button,
  Box,
  Autocomplete,
  Typography,
} from "@mui/material";
import { OpenInNew } from "@mui/icons-material";
import { LoadingSpinner } from "./LoadingSpinner";
import type { JiraConnectionDto } from "@/types/integration";
import Link from "next/link";

export interface StringOptions {
  options: string[];
  onChange: (value: string) => void;
  selectedOption: string | null;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface SubmitAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface SessionStartFormProps {
  selectedConnection: JiraConnectionDto | null;
  connections: JiraConnectionDto[];
  onConnectionChange: (connection: JiraConnectionDto) => void;
  projectKeyOptions?: StringOptions;
  storyKeyOptions?: StringOptions;
  submitAction?: SubmitAction;
  loading?: boolean;
}

export const SessionStartForm: React.FC<SessionStartFormProps> = ({
  selectedConnection,
  connections,
  onConnectionChange,
  projectKeyOptions,
  storyKeyOptions,
  submitAction,
  loading,
}) => {
  if (connections.length === 0) {
    // No connnections available, add a link to /profile to set up connections
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" color="error" gutterBottom>
          No Connections Available
        </Typography>
        <Box>
          <Link
            href="/profile"
            style={{ color: "white", textDecoration: "underline" }}
          >
            Set up connection
          </Link>
          <OpenInNew
            fontSize="small"
            sx={{ verticalAlign: "middle", ml: 0.5 }}
          />
        </Box>
      </Box>
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
      {projectKeyOptions && (
        <Autocomplete
          fullWidth
          options={projectKeyOptions.options}
          value={projectKeyOptions.selectedOption || null}
          onChange={(event, newValue) => {
            projectKeyOptions.onChange(newValue || "");
          }}
          disabled={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={projectKeyOptions.label || "Project Key"}
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
      )}
      {storyKeyOptions && (
        <Autocomplete
          fullWidth
          options={storyKeyOptions.options}
          value={storyKeyOptions.selectedOption || null}
          onChange={(event, newValue) => {
            storyKeyOptions.onChange(newValue || "");
          }}
          disabled={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={storyKeyOptions.label || "Story Key (Optional)"}
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
      )}
      {submitAction && (
        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          disabled={loading || submitAction.disabled}
          onClick={submitAction.onClick}
        >
          {submitAction.label}
        </Button>
      )}
    </Box>
  );
};
