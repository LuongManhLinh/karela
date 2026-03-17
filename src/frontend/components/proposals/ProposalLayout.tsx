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
import { PageLevel } from "@/types";

export interface ProposalLayoutProps {
  children?: React.ReactNode;
  level: PageLevel;
  projectKey?: string;
  storyKey?: string;
  idOrKey?: string;
}

const ProposalLayout: React.FC<ProposalLayoutProps> = ({
  children,
  level,
  projectKey,
  storyKey,
  idOrKey,
}) => {
  const t = useTranslations("proposals.ProposalLayout");

  const getDataQuery = () => {
    switch (level) {
      case "connection":
        return useConnectionProposalsQuery();
      case "project":
        return useProjectProposalsQuery(projectKey!);
      case "story":
        return useStoryProposalsQuery(projectKey!, storyKey!);
    }
  };

  const { data: sessionsData, isLoading: isSessionsLoading } = getDataQuery();

  const basePath = useMemo(() => {
    switch (level) {
      case "connection":
        return `/app`;
      case "project":
        return `/app/projects/${projectKey}`;
      case "story":
        return `/app/projects/${projectKey}/stories/${storyKey}`;
    }
  }, [level, projectKey, storyKey]);

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
      headerText={t("headerText")}
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
    >
      {children}
    </PageLayout>
  );
};

export default ProposalLayout;
