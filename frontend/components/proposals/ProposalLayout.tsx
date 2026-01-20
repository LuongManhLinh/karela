"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProposalSource } from "@/types/proposal";
import { SessionItem } from "@/components/SessionList";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import {
  useProjectProposalsQuery,
  useStoryProposalsQuery,
} from "@/hooks/queries/useProposalQueries";
import PageLayout from "../PageLayout";

export interface ProposalLayoutProps {
  children?: React.ReactNode;
  level: "project" | "story";
}

const ProposalLayout: React.FC<ProposalLayoutProps> = ({ children, level }) => {
  const { selectedConnection, selectedProject, selectedStory } =
    useWorkspaceStore();

  const { data: sessionsData, isLoading: isSessionsLoading } =
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

  const handleSelectAnalysisSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    router.push(`${basePath}/proposals/${sessionId}?source=ANALYSIS`);
  };

  const handleSelectChatSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    router.push(`${basePath}/proposals/${sessionId}?source=CHAT`);
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
    <PageLayout
      level={level}
      href="proposals"
      primarySessions={{
        sessions: analysisSessions,
        selectedSessionId: selectedSessionId,
        onSelectSession: handleSelectAnalysisSession,
        loading: isSessionsLoading,
        emptyStateText: "No analysis sessions having proposals",
        label: "Analysis Proposals",
      }}
      secondarySessions={{
        sessions: chatSessions,
        selectedSessionId: selectedSessionId,
        onSelectSession: handleSelectChatSession,
        loading: isSessionsLoading,
        emptyStateText: "No chat sessions having proposals",
        label: "Chat Proposals",
      }}
      useNoStoryFilter
    >
      {children}
    </PageLayout>
  );
};

export default ProposalLayout;
