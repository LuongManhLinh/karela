"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionItem } from "@/components/SessionList";
import {
  useConnectionProposalsQuery,
  useProjectProposalsQuery,
  useStoryProposalsQuery,
} from "@/hooks/queries/useProposalQueries";
import PageLayout from "../PageLayout";
import { useTranslations } from "next-intl";
import { idID } from "@mui/material/locale";
import { PageLevel } from "@/types";

export interface ProposalLayoutProps {
  children?: React.ReactNode;
  level: PageLevel;
  connectionName: string;
  projectKey?: string;
  storyKey?: string;
  idOrKey?: string;
}

const ProposalLayout: React.FC<ProposalLayoutProps> = ({
  children,
  level,
  connectionName,
  projectKey,
  storyKey,
  idOrKey,
}) => {
  const t = useTranslations("proposals.ProposalLayout");

  const getDataQuery = () => {
    switch (level) {
      case "connection":
        return useConnectionProposalsQuery(connectionName);
      case "project":
        return useProjectProposalsQuery(connectionName, projectKey!);
      case "story":
        return useStoryProposalsQuery(connectionName, projectKey!, storyKey!);
    }
  };

  const { data: sessionsData, isLoading: isSessionsLoading } = getDataQuery();

  const basePath = useMemo(() => {
    switch (level) {
      case "connection":
        return `/connections/${connectionName}`;
      case "project":
        return `/connections/${connectionName}/projects/${projectKey}`;
      case "story":
        return `/connections/${connectionName}/projects/${projectKey}/stories/${storyKey}`;
    }
  }, [level, connectionName, projectKey, storyKey]);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    idOrKey || null,
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
      connectionName={connectionName}
      projectKey={projectKey}
      storyKey={storyKey}
      primarySessions={{
        sessions: analysisSessions,
        selectedSessionId: selectedSessionId,
        onSelectSession: handleSelectAnalysisSession,
        loading: isSessionsLoading,
        emptyStateText: t("noAnalysisSessions"),
        label: t("analysisProposals"),
      }}
      secondarySessions={{
        sessions: chatSessions,
        selectedSessionId: selectedSessionId,
        onSelectSession: handleSelectChatSession,
        loading: isSessionsLoading,
        emptyStateText: t("noChatSessions"),
        label: t("chatProposals"),
      }}
      disablePrimaryAutoRoute
      disableSecondaryAutoRoute
      useNoStoryFilter
    >
      {children}
    </PageLayout>
  );
};

export default ProposalLayout;
