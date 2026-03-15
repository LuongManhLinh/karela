"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { Info, BugReport, EmojiObjects, Code } from "@mui/icons-material";
import { useTranslations } from "next-intl";

import PanelManager, {
  type PanelConfig,
} from "@/components/workspace/PanelManager";
import {
  InformationPanelContent,
  DefectsPanelContent,
  ProposalsPanelContent,
  ACPanelContent,
} from "./panels";

import { useStoryDetailsQuery } from "@/hooks/queries/useConnectionQueries";
import {
  useDefectsByStoryQuery,
  useMarkDefectSolvedMutation,
} from "@/hooks/queries/useAnalysisQueries";
import {
  useStoryProposalsQuery,
  useActOnProposalMutation,
  useActOnProposalContentMutation,
} from "@/hooks/queries/useProposalQueries";
import { useACsByStoryQuery } from "@/hooks/queries/useACQueries";
import { acService } from "@/services/acService";
import { proposalService } from "@/services/proposalService";
import type {
  ProposalDto,
  ProposalActionFlag,
  ProposalContentDto,
  SessionsWithProposals,
} from "@/types/proposal";
import type { DefectDto } from "@/types/analysis";
import type { ACDto, ACSummary } from "@/types/ac";
import type { SessionSummary } from "@/types";
import { useNotificationContext } from "@/providers/NotificationProvider";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

interface WorkspacePageProps {
  connectionName: string;
  projectKey: string;
  storyKey: string;
}

const WorkspacePage: React.FC<WorkspacePageProps> = ({
  connectionName,
  projectKey,
  storyKey,
}) => {
  const t = useTranslations("workspace.WorkspacePage");

  const { notify } = useNotificationContext();

  // State for AC details (since we need to fetch each AC individually for content)
  const [acDetails, setAcDetails] = useState<Record<string, ACDto>>({});
  const [loadingAcDetails, setLoadingAcDetails] = useState(false);

  // State for proposals (need to fetch from multiple sessions)
  const [proposals, setProposals] = useState<ProposalDto[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  // Queries
  const { data: storyData, isLoading: isStoryLoading } = useStoryDetailsQuery(
    connectionName,
    storyKey,
  );
  const story = useMemo(() => storyData?.data || null, [storyData]);

  const { data: defectsData, isLoading: isDefectsLoading } =
    useDefectsByStoryQuery(connectionName, projectKey, storyKey);
  const defects = useMemo<DefectDto[]>(
    () => defectsData?.data || [],
    [defectsData],
  );

  // Get sessions that have proposals for this story
  const { data: proposalsSessionsData, isLoading: isProposalsSessionsLoading } =
    useStoryProposalsQuery(connectionName, projectKey, storyKey);

  // Fetch proposals from all sessions
  useEffect(() => {
    const fetchProposalsFromSessions = async () => {
      if (!proposalsSessionsData?.data) {
        setProposals([]);
        return;
      }

      const sessionsWithProposals =
        proposalsSessionsData.data as SessionsWithProposals;
      const allSessions: {
        session: SessionSummary;
        source: "ANALYSIS" | "CHAT";
      }[] = [
        ...(sessionsWithProposals.analysis_sessions || []).map((s) => ({
          session: s,
          source: "ANALYSIS" as const,
        })),
        ...(sessionsWithProposals.chat_sessions || []).map((s) => ({
          session: s,
          source: "CHAT" as const,
        })),
      ];

      if (allSessions.length === 0) {
        setProposals([]);
        return;
      }

      setLoadingProposals(true);
      const allProposals: ProposalDto[] = [];

      try {
        await Promise.all(
          allSessions.map(async ({ session, source }) => {
            try {
              const response = await proposalService.getProposalsBySession(
                session.id,
                source,
                connectionName,
                projectKey,
                storyKey,
              );
              if (response.data) {
                allProposals.push(...response.data);
              }
            } catch (e) {
              console.error(
                `Failed to fetch proposals for session ${session.id}:`,
                e,
              );
            }
          }),
        );
        setProposals(allProposals);
      } finally {
        setLoadingProposals(false);
      }
    };

    fetchProposalsFromSessions();
  }, [proposalsSessionsData, connectionName, projectKey, storyKey]);

  const isProposalsLoading = isProposalsSessionsLoading || loadingProposals;

  const { data: acsData, isLoading: isAcsLoading } = useACsByStoryQuery(
    connectionName,
    projectKey,
    storyKey,
  );
  const acs = useMemo<ACSummary[]>(() => acsData?.data || [], [acsData]);

  // Fetch AC details when acs change
  useEffect(() => {
    const fetchAcDetails = async () => {
      if (acs.length === 0) return;

      setLoadingAcDetails(true);
      const details: Record<string, ACDto> = {};

      try {
        await Promise.all(
          acs.map(async (ac) => {
            try {
              const response = await acService.getAC(connectionName, ac.id);
              if (response.data) {
                details[ac.id] = response.data;
              }
            } catch (e) {
              console.error(`Failed to fetch AC ${ac.id}:`, e);
            }
          }),
        );
        setAcDetails(details);
      } finally {
        setLoadingAcDetails(false);
      }
    };

    fetchAcDetails();
  }, [acs, connectionName]);

  // Mutations
  const { mutateAsync: markDefectSolved } = useMarkDefectSolvedMutation();
  const { mutateAsync: actOnProposal } = useActOnProposalMutation();
  const { mutateAsync: actOnProposalContent } =
    useActOnProposalContentMutation();

  // Handlers
  const handleMarkDefectSolved = useCallback(
    async (defectId: string, solved: boolean) => {
      try {
        await markDefectSolved({ defectId, solved });
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail || t("errors.failedToUpdateDefect");
        notify(errorMessage, { severity: "error" });
      }
    },
    [markDefectSolved, t, notify],
  );

  const handleProposalAction = useCallback(
    async (proposalId: string, flag: ProposalActionFlag) => {
      try {
        await actOnProposal({ proposalId, flag });
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail || t("errors.failedToUpdateProposal");
        notify(errorMessage, { severity: "error" });
      }
    },
    [actOnProposal, t, notify],
  );

  const handleProposalContentAction = useCallback(
    async (
      proposalId: string,
      content: ProposalContentDto,
      flag: ProposalActionFlag,
    ) => {
      if (!content.id) return;
      try {
        await actOnProposalContent({ proposalId, contentId: content.id, flag });
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail || t("errors.failedToUpdateProposal");
        notify(errorMessage, { severity: "error" });
      }
    },
    [actOnProposalContent, t, notify],
  );

  const handleSaveAC = useCallback(
    async (acId: string, newContent: string) => {
      try {
        // Add gherkin markers
        const gherkinContent = "```gherkin\n" + newContent + "\n```";
        await acService.updateAC(acId, gherkinContent);

        // Update local state
        setAcDetails((prev) => ({
          ...prev,
          [acId]: {
            ...prev[acId],
            description: gherkinContent,
          },
        }));
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail || t("errors.failedToUpdateAC");
        notify(errorMessage, { severity: "error" });
        throw err;
      }
    },
    [t, notify],
  );

  // Panel configurations
  const panels = useMemo(() => {
    const panelConfigs: { config: PanelConfig; content: React.ReactNode }[] = [
      {
        config: {
          id: "information",
          title: t("information"),
          icon: <Info fontSize="small" />,
          defaultOpen: true,
        },
        content: (
          <InformationPanelContent story={story} loading={isStoryLoading} />
        ),
      },
      {
        config: {
          id: "defects",
          title: t("defects"),
          icon: <BugReport fontSize="small" />,
          defaultOpen: true,
        },
        content: (
          <DefectsPanelContent
            defects={defects}
            loading={isDefectsLoading}
            onMarkSolved={handleMarkDefectSolved}
          />
        ),
      },
      {
        config: {
          id: "proposals",
          title: t("proposals"),
          icon: <EmojiObjects fontSize="small" />,
          defaultOpen: true,
        },
        content: (
          <ProposalsPanelContent
            proposals={proposals}
            loading={isProposalsLoading}
            onProposalAction={handleProposalAction}
            onProposalContentAction={handleProposalContentAction}
          />
        ),
      },
      {
        config: {
          id: "acceptance-criteria",
          title: t("acceptanceCriteria"),
          icon: <Code fontSize="small" />,
          defaultOpen: true,
        },
        content: (
          <ACPanelContent
            acs={acs}
            acDetails={acDetails}
            loading={isAcsLoading || loadingAcDetails}
            onSaveAC={handleSaveAC}
            connectionName={connectionName}
            projectKey={projectKey}
          />
        ),
      },
    ];

    return panelConfigs;
  }, [
    t,
    story,
    isStoryLoading,
    defects,
    isDefectsLoading,
    handleMarkDefectSolved,
    proposals,
    isProposalsLoading,
    handleProposalAction,
    handleProposalContentAction,
    acs,
    acDetails,
    isAcsLoading,
    loadingAcDetails,
    handleSaveAC,
    connectionName,
    projectKey,
  ]);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      <PanelManager panels={panels} />
    </Box>
  );
};

export default WorkspacePage;
