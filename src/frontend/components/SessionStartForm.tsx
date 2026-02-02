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
import type {
  ConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/connection";
import { useTranslations } from "next-intl";

import { scrollBarSx } from "@/constants/scrollBarSx";

export interface SelectableOptions<T> {
  options: T[];
  selectedOption: T | null;
  onChange?: (value: T | null) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export interface SubmitAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface SessionStartFormProps {
  connectionOptions: SelectableOptions<ConnectionDto>;
  projectOptions?: SelectableOptions<ProjectDto>;
  storyOptions?: SelectableOptions<StorySummary>;
  primaryAction?: SubmitAction;
  secondaryAction?: SubmitAction;
}

export const SessionStartForm: React.FC<SessionStartFormProps> = ({
  connectionOptions,
  projectOptions,
  storyOptions,
  primaryAction,
  secondaryAction,
}) => {
  const t = useTranslations("SessionStartForm");

  const getStoryLabel = (story: StorySummary) => {
    if (story.key === "none") {
      return story.summary || t("noStory");
    } else {
      return `${story.key} - ${story.summary || ""}`;
    }
  };

  const getStoryRenderOptionLabel = (option: StorySummary) => {
    if (option.key === "none") {
      return option.summary || t("noStory");
    } else {
      return `${option.key} - ${option.summary || ""}`;
    }
  };

  return (
    <Box>
      {connectionOptions && (
        <Autocomplete
          title={
            connectionOptions.selectedOption
              ? connectionOptions.selectedOption.url ||
                connectionOptions.selectedOption.name ||
                ""
              : ""
          }
          fullWidth
          options={connectionOptions.options}
          value={
            connectionOptions.options.find(
              (conn) => conn.id === connectionOptions.selectedOption?.id,
            ) || null
          }
          onChange={(_, newValue) => {
            if (newValue) {
              connectionOptions.onChange &&
                connectionOptions.onChange(newValue);
            }
          }}
          getOptionLabel={(option) => option.name || option.id}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          disabled={connectionOptions.loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={connectionOptions.label || t("selectConnection")}
              required
              margin="normal"
              InputProps={{
                ...params.InputProps,
                startAdornment: connectionOptions.loading ? (
                  <CircularProgress
                    size={20}
                    sx={{
                      mx: 1,
                    }}
                  />
                ) : connectionOptions.selectedOption ? (
                  <Box
                    component="img"
                    src={connectionOptions.selectedOption.avatar_url}
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
                {option.name}{" "}
                {option.num_projects &&
                  `(${option.num_projects} ${t("projects")})`}
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
      )}
      {projectOptions && (
        <Autocomplete
          title={
            projectOptions.selectedOption
              ? `${projectOptions.selectedOption.key} - ${projectOptions.selectedOption.name}`
              : ""
          }
          fullWidth
          options={projectOptions.options}
          value={projectOptions.selectedOption || null}
          onChange={(_, newValue) => {
            projectOptions.onChange &&
              projectOptions.onChange(newValue || null);
          }}
          disabled={projectOptions.loading}
          getOptionLabel={(option) => `${option.key} - ${option.name || ""}`}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label={projectOptions.label || t("selectProject")}
              required
              margin="normal"
              InputProps={{
                ...params.InputProps,
                startAdornment: projectOptions.loading ? (
                  <CircularProgress
                    size={20}
                    sx={{
                      mx: 1,
                    }}
                  />
                ) : projectOptions.selectedOption ? (
                  <Box
                    component="img"
                    src={projectOptions.selectedOption.avatar_url}
                    alt="icon"
                    sx={{ width: 20, height: 20, mx: 1 }}
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
                (option.name || "").toLowerCase().startsWith(searchValue),
            );
          }}
          slots={{
            paper: ({ children }) => (
              <Paper sx={{ ...scrollBarSx, borderRadius: 1 }}>{children}</Paper>
            ),
          }}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box
                  src={option.avatar_url}
                  component="img"
                  alt="icon"
                  sx={{ width: 20, height: 20, mx: 1 }}
                />
                {option.key} - {option.name}{" "}
                {option.num_stories
                  ? `(${option.num_stories} ${t("stories")})`
                  : null}
              </Box>
            </li>
          )}
        />
      )}
      {storyOptions && (
        <Autocomplete
          title={
            storyOptions.selectedOption
              ? getStoryLabel(storyOptions.selectedOption)
              : ""
          }
          fullWidth
          options={storyOptions.options}
          value={storyOptions.selectedOption || null}
          onChange={(_, newValue) => {
            storyOptions.onChange && storyOptions.onChange(newValue || null);
          }}
          disabled={storyOptions.loading}
          getOptionLabel={getStoryLabel}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label={storyOptions.label || t("selectStory")}
              margin="normal"
              sx={{ minWidth: 150 }}
              InputProps={{
                ...params.InputProps,
                startAdornment: storyOptions.loading ? (
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
                (option.summary || "").toLowerCase().startsWith(searchValue),
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
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
        {primaryAction && (
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={
              primaryAction.disabled ||
              connectionOptions?.loading ||
              projectOptions?.loading ||
              storyOptions?.loading
            }
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            type="button"
            variant="outlined"
            fullWidth
            disabled={
              secondaryAction.disabled ||
              connectionOptions?.loading ||
              projectOptions?.loading ||
              storyOptions?.loading
            }
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </Button>
        )}
      </Box>
    </Box>
  );
};
