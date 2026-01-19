"use client";

import React, { useMemo, useState } from "react";
import { Box, Divider, Typography } from "@mui/material";
import type { ProposalSource } from "@/types/proposal";
import type {
  ConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/connection";
import { DoubleLayout } from "@/components/Layout";
import { SessionStartForm } from "@/components/SessionStartForm";
import SessionList, { SessionItem } from "@/components/SessionList";
import HeaderContent from "@/components/HeaderContent";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import {
  useProjectProposalsQuery,
  useStoryProposalsQuery,
} from "@/hooks/queries/useProposalQueries";
import { useRouter } from "next/navigation";
import { Project } from "next/dist/build/swc/types";

export interface ProposalLayoutProps {
  children?: React.ReactNode;
  level: "project" | "story";
}

const ProposalLayout: React.FC<ProposalLayoutProps> = ({ children, level }) => {
  const {
    connections,
    selectedConnection,
    setSelectedConnection,
    projects,
    selectedProject,
    setSelectedProject,
    stories,
    selectedStory,
    setSelectedStory,
  } = useWorkspaceStore();

  const { data: sessionsData } =
    level === "project"
      ? useProjectProposalsQuery(selectedConnection?.id, selectedProject?.key)
      : useStoryProposalsQuery(
          selectedConnection?.id,
          selectedProject?.key,
          selectedStory?.key,
        );

  const basePath = useMemo(
    () =>
      level === "project"
        ? `/app/connections/${selectedConnection?.name}/projects/${selectedProject?.key}`
        : `/app/connections/${selectedConnection?.name}/projects/${selectedProject?.key}/stories/${selectedStory?.key}`,
    [level, selectedConnection, selectedProject, selectedStory],
  );

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  const router = useRouter();

  const handleConnectionChange = async (conn: ConnectionDto | null) => {
    setSelectedConnection(conn);
    setSelectedProject(null);
  };

  const handleProjectChange = async (proj: ProjectDto | null) => {
    setSelectedProject(proj);
    setSelectedStory(null);
  };

  const handleStoryChange = async (story: StorySummary | null) => {
    setSelectedStory(story);
  };

  const handleSelectSession = async (
    sessionId: string,
    source: ProposalSource,
  ) => {
    setSelectedSessionId(sessionId);
    router.push(`${basePath}/proposals/${sessionId}?source=${source}`);
  };

  const handleFilter = () => {
    if (selectedConnection && selectedProject) {
      if (selectedStory) {
        router.push(
          `/app/connections/${selectedConnection.name}/projects/${selectedProject.key}/stories/${selectedStory.key}/analyses`,
        );
      } else {
        router.push(
          `/app/connections/${selectedConnection.name}/projects/${selectedProject.key}/analyses`,
        );
      }
    }
  };

  const analysisSessions = useMemo<SessionItem[]>(() => {
    if (!sessionsData?.data) return [];

    return sessionsData.data.analysis_sessions.map((session) => ({
      id: session.id,
      title: session.key,
      subtitle: new Date(session.created_at).toLocaleString(),
    }));
  }, [sessionsData]);

  const chatSessions = useMemo<SessionItem[]>(() => {
    if (!sessionsData?.data) return [];

    return sessionsData.data.chat_sessions.map((session) => ({
      id: session.id,
      title: session.key,
      subtitle: new Date(session.created_at).toLocaleString(),
    }));
  }, [sessionsData]);

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
          <SessionStartForm
            connectionOptions={{
              options: connections,
              selectedOption: selectedConnection,
              onChange: handleConnectionChange,
            }}
            projectOptions={{
              options: projects,
              selectedOption: selectedProject,
              onChange: handleProjectChange,
            }}
            storyOptions={{
              options: stories,
              selectedOption: selectedStory,
              onChange: handleStoryChange,
            }}
            primaryAction={{
              label: "Filter",
              onClick: handleFilter,
            }}
          />
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
            Analysis Proposals
          </Typography>
          <SessionList
            sessions={analysisSessions}
            selectedId={selectedSessionId || null}
            onSelect={(id: string) => handleSelectSession(id, "ANALYSIS")}
            emptyStateText="No analysis sessions having proposals"
          />
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
            Chat Proposals
          </Typography>
          <SessionList
            sessions={chatSessions}
            selectedId={selectedSessionId || null}
            onSelect={(id: string) => handleSelectSession(id, "CHAT")}
            emptyStateText="No chat sessions having proposals"
          />
        </Box>
      }
      rightChildren={children}
      appBarLeftContent={<HeaderContent headerText="Proposals" />}
      appBarTransparent
      basePath={basePath}
    />
  );
};

export default ProposalLayout;
