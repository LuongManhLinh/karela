"use client";

import React from "react";
import { Box, Typography, Stack, CircularProgress } from "@mui/material";
import { useTranslations } from "next-intl";
import { ProposalCard } from "@/components/proposals/ProposalCard";
import type {
  ProposalDto,
  ProposalActionFlag,
  ProposalContentDto,
} from "@/types/proposal";

interface ProposalsPanelContentProps {
  proposals: ProposalDto[];
  loading?: boolean;
  onProposalAction?: (
    proposalId: string,
    flag: ProposalActionFlag,
  ) => Promise<void> | void;
  onProposalContentAction?: (
    proposalId: string,
    content: ProposalContentDto,
    flag: ProposalActionFlag,
  ) => Promise<void> | void;
}

export const ProposalsPanelContent: React.FC<ProposalsPanelContentProps> = ({
  proposals,
  loading,
  onProposalAction,
  onProposalContentAction,
}) => {
  const t = useTranslations("workspace.WorkspacePage");

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (proposals.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center">
        {t("noProposals")}
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          onProposalAction={onProposalAction}
          onProposalContentAction={onProposalContentAction}
          defaultExpanded
          showProjectChip={false}
          showSourceChip={true}
        />
      ))}
    </Stack>
  );
};

export default ProposalsPanelContent;
