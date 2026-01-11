"use client";

import React from "react";
import {
  TextField,
  Button,
  Box,
  Autocomplete,
  Typography,
  CircularProgress,
  Paper,
} from "@mui/material";
import { OpenInNew } from "@mui/icons-material";
import type {
  JiraConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/integration";
import { useRouter } from "next/navigation";
import { scrollBarSx } from "@/constants/scrollBarSx";

export interface SelectableOptions<T> {
  options: T[];
  onChange: (value: T | null) => void;
  selectedOption: T | null;
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
  projectKeyOptions?: SelectableOptions<ProjectDto>;
  storyKeyOptions?: SelectableOptions<StorySummary>;
  submitAction?: SubmitAction;
  loadingConnections?: boolean;
  loadingProjectKeys?: boolean;
  loadingStoryKeys?: boolean;
}

export const SessionStartForm: React.FC<SessionStartFormProps> = ({
  selectedConnection,
  connections,
  onConnectionChange,
  projectKeyOptions,
  storyKeyOptions,
  submitAction,
  loadingConnections,
  loadingProjectKeys,
  loadingStoryKeys,
}) => {
  const router = useRouter();
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
          <Typography
            variant="body1"
            sx={{ mb: 1, textDecoration: "underline", cursor: "pointer" }}
            onClick={() => router.push("/profile")}
          >
            Set up connection
            <OpenInNew
              fontSize="small"
              sx={{ verticalAlign: "middle", ml: 0.5 }}
            />
          </Typography>
        </Box>
      </Box>
    );
  }

  const getStoryLabel = (story: StorySummary) => {
    if (story.key === "none") {
      return story.summary || "(No Story)";
    } else {
      return `${story.key} - ${story.summary || ""}`;
    }
  };

  const getStoryRenderOptionLabel = (option: StorySummary) => {
    if (option.key === "none") {
      return option.summary || "(No Story)";
    } else {
      return `${option.key} - ${option.summary || ""}`;
    }
  };

  return (
    <Box>
      <Autocomplete
        title={
          selectedConnection
            ? selectedConnection.url || selectedConnection.name || ""
            : ""
        }
        fullWidth
        options={connections}
        value={
          connections.find((conn) => conn.id === selectedConnection?.id) || null
        }
        onChange={(_, newValue) => {
          if (newValue) {
            onConnectionChange(newValue);
          }
        }}
        getOptionLabel={(option) => option.name || option.id}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        disabled={loadingConnections}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Connection"
            required
            margin="normal"
            InputProps={{
              ...params.InputProps,
              startAdornment: loadingConnections ? (
                <CircularProgress
                  size={20}
                  sx={{
                    mx: 1,
                  }}
                />
              ) : selectedConnection ? (
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
              <Box
                src={option.avatar_url}
                component="img"
                alt="icon"
                sx={{ width: 20, height: 20, mx: 1 }}
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
        slots={{
          paper: ({ children }) => (
            <Paper sx={{ ...scrollBarSx, borderRadius: 1 }}>{children}</Paper>
          ),
        }}
      />
      {projectKeyOptions && (
        <Autocomplete
          title={
            projectKeyOptions.selectedOption
              ? `${projectKeyOptions.selectedOption.key} - ${projectKeyOptions.selectedOption.name}`
              : ""
          }
          fullWidth
          options={projectKeyOptions.options}
          value={projectKeyOptions.selectedOption || null}
          onChange={(_, newValue) => {
            projectKeyOptions.onChange(newValue || null);
          }}
          disabled={loadingConnections}
          getOptionLabel={(option) => `${option.key} - ${option.name || ""}`}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label={projectKeyOptions.label || "Project Key"}
              required
              margin="normal"
              sx={{ minWidth: 120 }}
              InputProps={{
                ...params.InputProps,
                startAdornment: loadingProjectKeys ? (
                  <CircularProgress
                    size={20}
                    sx={{
                      mx: 1,
                    }}
                  />
                ) : null,
              }}
            />
          )}
          filterOptions={(options, { inputValue }) => {
            if (!inputValue) return options;
            const searchValue = inputValue.toLowerCase();
            return options.filter(
              (option) =>
                option.key.toLowerCase().startsWith(searchValue) ||
                (option.name || "").toLowerCase().startsWith(searchValue)
            );
          }}
          slots={{
            paper: ({ children }) => (
              <Paper sx={{ ...scrollBarSx, borderRadius: 1 }}>{children}</Paper>
            ),
          }}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Typography>
                {option.key} - {option.name}
              </Typography>
            </li>
          )}
        />
      )}
      {storyKeyOptions && (
        <Autocomplete
          title={
            storyKeyOptions.selectedOption
              ? getStoryLabel(storyKeyOptions.selectedOption)
              : ""
          }
          fullWidth
          options={storyKeyOptions.options}
          value={storyKeyOptions.selectedOption || null}
          onChange={(_, newValue) => {
            storyKeyOptions.onChange(newValue || null);
          }}
          disabled={loadingConnections}
          getOptionLabel={getStoryLabel}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label={storyKeyOptions.label || "Story Key (Optional)"}
              margin="normal"
              sx={{ minWidth: 150 }}
              InputProps={{
                ...params.InputProps,
                startAdornment: loadingStoryKeys ? (
                  <CircularProgress
                    size={20}
                    sx={{
                      mx: 1,
                    }}
                  />
                ) : null,
              }}
            />
          )}
          filterOptions={(options, { inputValue }) => {
            if (!inputValue) return options;
            const searchValue = inputValue.toLowerCase();
            return options.filter(
              (option) =>
                option.key.toLowerCase().startsWith(searchValue) ||
                (option.summary || "").toLowerCase().startsWith(searchValue)
            );
          }}
          slots={{
            paper: ({ children }) => (
              <Paper sx={{ ...scrollBarSx, borderRadius: 1 }}>{children}</Paper>
            ),
          }}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Typography>{getStoryRenderOptionLabel(option)}</Typography>
            </li>
          )}
        />
      )}
      {submitAction && (
        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          disabled={loadingConnections || submitAction.disabled}
          onClick={submitAction.onClick}
        >
          {submitAction.label}
        </Button>
      )}
    </Box>
  );
};
