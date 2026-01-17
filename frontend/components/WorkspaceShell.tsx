"use client";
import { Box, Divider, Typography } from "@mui/material";

import { DoubleLayout } from "./Layout";
import type {
  JiraConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/integration";
import {
  SessionStartForm,
  SelectableOptions,
  SubmitAction,
} from "./SessionStartForm";
import React from "react";
import SessionList, { SessionItem } from "./SessionList";
import HeaderContent from "./HeaderContent";
import { NoConnection } from "./NoConnection";

interface WorkspaceShellProps {
  connectionOptions: SelectableOptions<JiraConnectionDto>;
  projectOptions?: SelectableOptions<ProjectDto>;
  storyOptions?: SelectableOptions<StorySummary>;
  submitAction?: SubmitAction;
  sessions: SessionItem[];
  selectedSessionId?: string | null;
  onSelectSession: (id: string) => void;
  loadingSessions?: boolean;
  loadingConnections?: boolean;
  loadingProjectKeys?: boolean;
  loadingStoryKeys?: boolean;
  emptyStateText?: string;
  sessionListLabel?: string;
  rightChildren: React.ReactNode;
  headerText?: string;
  headerProjectKey?: string;
  headerStoryKey?: string;
  appBarTransparent?: boolean;
  sidebarFooter?: React.ReactNode;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  connectionOptions,
  projectOptions,
  storyOptions,
  submitAction,
  sessions,
  selectedSessionId,
  onSelectSession,
  loadingSessions,
  loadingConnections,
  loadingProjectKeys,
  loadingStoryKeys,
  emptyStateText = "No sessions yet",
  sessionListLabel = "Sessions",
  rightChildren,
  headerText,
  headerProjectKey,
  headerStoryKey,
  appBarTransparent = true,
  sidebarFooter,
}) => {
  return (
    <DoubleLayout
      leftChildren={
        <Box
          sx={{
            p: 2,
            height: "100%",
            flexDirection: "column",
            display: "flex",
          }}
        >
          {connectionOptions.options.length > 0 ? (
            <SessionStartForm
              connectionOptions={connectionOptions}
              projectOptions={projectOptions}
              storyOptions={storyOptions}
              primaryAction={submitAction}
              loadingConnections={loadingConnections}
              loadingProjectKeys={loadingProjectKeys}
              loadingStoryKeys={loadingStoryKeys}
            />
          ) : (
            <NoConnection />
          )}
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="subtitle2"
            sx={{
              textTransform: "uppercase",
              mb: 1,
              color: "text.secondary",
            }}
          >
            {sessionListLabel}
          </Typography>
          <SessionList
            sessions={sessions}
            selectedId={selectedSessionId || null}
            onSelect={onSelectSession}
            loading={loadingSessions}
            emptyStateText={emptyStateText}
          />
          {sidebarFooter ? <Box sx={{ mt: 3 }}>{sidebarFooter}</Box> : null}
        </Box>
      }
      rightChildren={rightChildren}
      appBarLeftContent={
        <HeaderContent
          headerText={headerText}
          headerProjectKey={headerProjectKey}
          headerStoryKey={headerStoryKey}
        />
      }
      appBarTransparent={appBarTransparent}
    />
  );
};
