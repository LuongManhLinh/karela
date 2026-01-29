"use client";
import { Box, Divider, Typography } from "@mui/material";

import { DoubleLayout } from "./Layout";
import type {
  ConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/connection";
import {
  SessionStartForm,
  SelectableOptions,
  SubmitAction,
} from "./SessionStartForm";
import React from "react";
import SessionList, { SessionItem } from "./SessionList";
import HeaderContent from "./HeaderContent";
import { NoConnection } from "./NoConnection";

export interface WorkspaceSessions {
  sessions: SessionItem[];
  selectedSessionId?: string | null;
  onSelectSession?: (id: string) => void;
  label?: string;
  emptyStateText?: string;
  loading?: boolean;
}

export interface WorkspaceShellProps {
  connectionOptions: SelectableOptions<ConnectionDto>;
  projectOptions?: SelectableOptions<ProjectDto>;
  storyOptions?: SelectableOptions<StorySummary>;
  primaryAction?: SubmitAction;
  secondaryAction?: SubmitAction;
  primarySessions: WorkspaceSessions;
  secondarySessions?: WorkspaceSessions;
  rightChildren: React.ReactNode;
  headerText?: string;
  headerProjectKey?: string;
  headerStoryKey?: string;
  appBarTransparent?: boolean;
  sidebarFooter?: React.ReactNode;
  basePath?: string;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  connectionOptions,
  projectOptions,
  storyOptions,
  primaryAction,
  secondaryAction,
  primarySessions,
  secondarySessions,
  rightChildren,
  headerText,
  headerProjectKey,
  headerStoryKey,
  appBarTransparent = true,
  sidebarFooter,
  basePath,
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
              primaryAction={primaryAction}
              secondaryAction={secondaryAction}
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
            {primarySessions.label || "Sessions"}
          </Typography>
          <SessionList
            sessions={primarySessions.sessions}
            selectedId={primarySessions.selectedSessionId}
            onSelect={primarySessions.onSelectSession || (() => {})}
            loading={primarySessions.loading}
            emptyStateText={primarySessions.emptyStateText}
          />
          {secondarySessions && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography
                variant="subtitle2"
                sx={{
                  textTransform: "uppercase",
                  mb: 1,
                  color: "text.secondary",
                }}
              >
                {secondarySessions.label || "Sessions"}
              </Typography>
              <SessionList
                sessions={secondarySessions.sessions}
                selectedId={secondarySessions.selectedSessionId}
                onSelect={secondarySessions.onSelectSession || (() => {})}
                loading={secondarySessions.loading}
                emptyStateText={secondarySessions.emptyStateText}
              />
            </>
          )}
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
      basePath={basePath}
    />
  );
};
