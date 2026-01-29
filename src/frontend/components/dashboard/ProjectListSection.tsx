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
import { useTranslations } from "next-intl";
import type { ProjectDto } from "@/types/connection";
import { scrollBarSx } from "@/constants/scrollBarSx";

export interface ProjectListSectionProps {
  title: string;
  projects: ProjectDto[];
  emptyText?: string;
  onProjectClick?: (project: ProjectDto) => void;
  maxHeight?: number | string;
}

export const ProjectListSection: React.FC<ProjectListSectionProps> = ({
  title,
  projects,
  emptyText = "No projects",
  onProjectClick,
  maxHeight = 200,
}) => {
  const t = useTranslations("dashboard.ProjectListSection");
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
          label={projects.length}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>

      {projects.length === 0 ? (
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
            {emptyText || t("noProjects")}
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
          {projects.map((project) => (
            <ListItem key={project.id} disablePadding>
              <ListItemButton
                onClick={() => onProjectClick?.(project)}
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
                      {project.key}
                    </Typography>
                  }
                  secondary={
                    project.name && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {project.name}
                      </Typography>
                    )
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
