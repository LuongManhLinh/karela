"use client";
import {
  Box,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  Paper,
  Link as MuiLink,
  Stack,
} from "@mui/material";
import type { ChipProps } from "@mui/material";
import Link from "next/link";

import { DoubleLayout } from "./Layout";
import { LoadingSpinner } from "./LoadingSpinner";
import type { JiraConnectionDto } from "@/types/integration";
import { SessionStartForm } from "./SessionStartForm";
import React from "react";

export interface WorkspaceSessionItem {
  id: string;
  title: string;
  subtitle?: string;
  chips?: Array<{ label: string; color?: ChipProps["color"] }>;
}

interface WorkspaceShellProps {
  selectedConnection: JiraConnectionDto | null;
  connections: JiraConnectionDto[];
  onConnectionChange: (connection: JiraConnectionDto) => void;
  selectedProjectKey: string | null;
  projectKeys: string[];
  onProjectKeyChange: (projectKey: string) => void;
  selectedStoryKey?: string | null;
  storyKeys: string[];
  onStoryKeyChange: (storyKey: string) => void;
  onSessionFormSubmit: () => void;
  sessionSubmitLabel?: string;
  sessions: WorkspaceSessionItem[];
  selectedSessionId?: string | null;
  onSelectSession: (id: string) => void;
  loadingSessions?: boolean;
  loadingConnections?: boolean;
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
  connections,
  selectedConnection,
  onConnectionChange,
  selectedProjectKey,
  projectKeys,
  onProjectKeyChange,
  selectedStoryKey,
  storyKeys,
  onStoryKeyChange,
  onSessionFormSubmit,
  sessions,
  selectedSessionId,
  onSelectSession,
  loadingSessions,
  loadingConnections,
  emptyStateText = "No sessions yet",
  sessionListLabel = "Sessions",
  rightChildren,
  headerText,
  headerProjectKey,
  headerStoryKey,
  appBarTransparent = true,
  sidebarFooter,
  sessionSubmitLabel,
}) => {
  const renderConnections = () => {
    if (loadingConnections) {
      return (
        <Box sx={{ py: 4 }}>
          <LoadingSpinner />
        </Box>
      );
    }

    if (!connections.length) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "background.default",
            textAlign: "center",
            overflow: "auto",
          }}
        >
          <Typography variant="body2" gutterBottom>
            No connections available
          </Typography>
          <MuiLink component={Link} href="/profile" underline="hover">
            Setup connections
          </MuiLink>
        </Paper>
      );
    }

    return (
      <SessionStartForm
        selectedConnection={selectedConnection}
        connections={connections}
        onConnectionChange={onConnectionChange}
        selectedProjectKey={selectedProjectKey}
        projectKeys={projectKeys}
        onProjectKeyChange={onProjectKeyChange}
        selectedStoryKey={selectedStoryKey}
        storyKeys={storyKeys}
        onStoryKeyChange={onStoryKeyChange}
        onSubmit={onSessionFormSubmit}
        submitLabel={sessionSubmitLabel || "New Session"}
      />
    );
  };

  const renderSessions = () => {
    if (loadingSessions) {
      return <LoadingSpinner />;
    }

    if (!sessions.length) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          {emptyStateText}
        </Typography>
      );
    }

    return (
      <List
        sx={{
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          scrollbarColor: "#6b6b6b transparent",
          scrollbarWidth: "auto",
        }}
      >
        {sessions.map((session) => (
          <ListItem key={session.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => onSelectSession(session.id)}
              selected={selectedSessionId === session.id}
              sx={{
                borderRadius: 1,
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                },
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <ListItemText
                primary={
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
                      {session.title}
                    </Typography>
                    {session.chips?.map((chip, index) => (
                      <Chip
                        key={`${session.id}-chip-${index}`}
                        label={chip.label}
                        size="small"
                        color={chip.color}
                      />
                    ))}
                  </Box>
                }
                secondary={
                  session.subtitle ? (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {session.subtitle}
                    </Typography>
                  ) : undefined
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    );
  };

  const headerContent = (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      justifyContent="flex-start"
      sx={{
        width: "auto",
        py: 2,
        flex: "0 0 auto",
      }}
    >
      <Typography
        variant="h6"
        component="div"
        sx={{ userSelect: "none", whiteSpace: "nowrap" }}
      >
        {headerText || "Workspace"}
      </Typography>
      {headerProjectKey && <Chip label={headerProjectKey} color="primary" />}
      {headerStoryKey && <Chip label={headerStoryKey} color="secondary" />}
    </Stack>
  );

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
          {renderConnections()}
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="subtitle2"
            sx={{
              textTransform: "uppercase",
              mb: 1,
              ml: 2,
              color: "text.secondary",
            }}
          >
            {sessionListLabel}
          </Typography>
          {renderSessions()}
          {sidebarFooter ? <Box sx={{ mt: 3 }}>{sidebarFooter}</Box> : null}
        </Box>
      }
      rightChildren={rightChildren}
      appBarLeftContent={headerContent}
      appBarTransparent={appBarTransparent}
    />
  );
};
