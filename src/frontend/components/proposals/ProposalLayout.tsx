"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useConnectionProposalsQuery,
  useProjectProposalsQuery,
  useStoryProposalsQuery,
} from "@/hooks/queries/useProposalQueries";
import PageLayout from "../PageLayout";
import { useTranslations } from "next-intl";
import { PageLevel } from "@/types";
import {
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  Skeleton,
  Typography,
} from "@mui/material";
import { scrollBarSx } from "@/constants/scrollBarSx";

export interface ProposalLayoutProps {
  children: React.ReactNode;
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
  const tSessionList = useTranslations("SessionList");

  const connectionQuery = useConnectionProposalsQuery();
  const projectQuery = useProjectProposalsQuery(projectKey);
  const storyQuery = useStoryProposalsQuery(projectKey, storyKey);
  const currentQuery =
    level === "connection"
      ? connectionQuery
      : level === "project"
        ? projectQuery
        : storyQuery;

  const { data: sessionsData, isLoading: isSessionsLoading } = currentQuery;

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

  const handleSelectAnalysisSession = async (sessionKey: string) => {
    setSelectedSessionId(sessionKey);
    router.push(`${basePath}/proposals/${sessionKey}?source=ANALYSIS`);
  };

  const handleSelectChatSession = async (sessionKey: string) => {
    setSelectedSessionId(sessionKey);
    router.push(`${basePath}/proposals/${sessionKey}?source=CHAT`);
  };

  const analysisSessions = sessionsData?.data?.analysis_sessions || [];
  const chatSessions = sessionsData?.data?.chat_sessions || [];

  const renderSessionGroup = (
    sessions: typeof analysisSessions,
    emptyStateText: string,
    sourceLabel: string,
    onSelect: (sessionKey: string) => Promise<void>,
  ) => {
    if (isSessionsLoading) {
      return (
        <List sx={{ mb: 1.5 }}>
          {[1, 2].map((idx) => (
            <ListItem
              key={`${sourceLabel}-skeleton-${idx}`}
              disablePadding
              sx={{ mb: 1 }}
            >
              <Box
                sx={{
                  width: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  px: 1.5,
                  py: 1,
                }}
              >
                <Skeleton variant="text" width="65%" />
                <Skeleton variant="rounded" width={180} height={22} />
                <Skeleton variant="text" width="50%" />
              </Box>
            </ListItem>
          ))}
        </List>
      );
    }

    if (sessions.length === 0) {
      return (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, mb: 2 }}
        >
          {emptyStateText}
        </Typography>
      );
    }

    return (
      <List
        sx={{
          flex: 1,
          minHeight: 0,
          px: 1,
          overflowY: "auto",
          ...scrollBarSx,
        }}
      >
        {sessions.map((session) => {
          const isSelected = selectedSessionId === session.key;
          return (
            <ListItem
              key={`${sourceLabel}-${session.key}`}
              disablePadding
              sx={{ mb: 0.75 }}
            >
              <ListItemButton
                selected={isSelected}
                onClick={() => onSelect(session.key)}
                sx={{
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: isSelected ? "primary.main" : "divider",
                  alignItems: "flex-start",
                }}
              >
                <Box sx={{ width: "100%" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {session.key}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.4 }}
                  >
                    {new Date(session.created_at).toLocaleString()}
                  </Typography>
                  <Box
                    sx={{
                      mt: 1,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.75,
                    }}
                  >
                    <Chip size="small" label={`Source: ${sourceLabel}`} />
                    <Chip
                      size="small"
                      label={`${tSessionList("project")}: ${session.project_key}`}
                    />
                    {session.story_key && (
                      <Chip
                        size="small"
                        label={`${tSessionList("story")}: ${session.story_key}`}
                      />
                    )}
                    <Chip
                      size="small"
                      color="warning"
                      label={`${session.num_proposals} ${t("proposals")}`}
                    />
                  </Box>
                </Box>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    );
    2;
  };

  const sessionsComponent = (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ textTransform: "uppercase", color: "text.secondary", px: 2 }}
      >
        {t("analysisProposals")}
      </Typography>

      {renderSessionGroup(
        analysisSessions,
        t("noAnalysisSessions"),
        "ANALYSIS",
        handleSelectAnalysisSession,
      )}

      <Divider sx={{ my: 1.5 }} />

      <Typography
        variant="subtitle2"
        sx={{ textTransform: "uppercase", color: "text.secondary", mt: 1 }}
      >
        {t("chatProposals")}
      </Typography>
      {renderSessionGroup(
        chatSessions,
        t("noChatSessions"),
        "CHAT",
        handleSelectChatSession,
      )}
    </Box>
  );

  return (
    <PageLayout
      level={level}
      href="proposals"
      headerText={t("headerText")}
      projectKey={projectKey}
      storyKey={storyKey}
      sessionsComponent={sessionsComponent}
      disablePrimaryAutoRoute
      disableSecondaryAutoRoute
      createable={false}
    >
      {children}
    </PageLayout>
  );
};

export default ProposalLayout;
