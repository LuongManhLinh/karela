import { SessionItem } from "@/components/SessionList";
import { SelectableOptions, SubmitAction } from "@/components/SessionStartForm";
import React from "react";
import type { ConnectionDto, ProjectDto, StorySummary } from "./connection";

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
