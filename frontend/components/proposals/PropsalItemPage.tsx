"use client";

import React, { useMemo, useState } from "react";
import { Box, Divider, Stack, Typography, Button } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

import { proposalService } from "@/services/proposalService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AppSnackbar } from "@/components/AppSnackbar";
import { ProposalCard } from "@/components/proposals/ProposalCard";
import type {
  ProposalActionFlag,
  ProposalContentDto,
  ProposalSource,
} from "@/types/proposal";
import { downloadAsJson } from "@/utils/export_utils";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { useSessionProposalsQuery } from "@/hooks/queries/useProposalQueries";

export interface ProposalItemPageProps {
  connectionName: string;
  projectKey: string;
  storyKey?: string; // Required if level is "story"
  sessionIdOrKey: string;
  sessionSource: ProposalSource;
  level: "project" | "story";
}

const ProposalSessionItemPage: React.FC<ProposalItemPageProps> = ({
  connectionName,
  projectKey,
  storyKey,
  sessionIdOrKey,
  sessionSource,
  level,
}) => {
  const { data: proposalsData, isLoading: loadingProposals } =
    level === "project"
      ? useSessionProposalsQuery(
          sessionIdOrKey,
          sessionSource,
          connectionName,
          projectKey,
        )
      : useSessionProposalsQuery(
          sessionIdOrKey,
          sessionSource,
          connectionName,
          projectKey,
          storyKey,
        );

  const proposals = useMemo(() => proposalsData?.data || [], [proposalsData]);

  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  const handleProposalAction = async (
    proposalId: string,
    flag: ProposalActionFlag,
  ) => {
    try {
      await proposalService.actOnProposal(proposalId, flag);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to update proposal";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const handleProposalContentAction = async (
    proposalId: string,
    content: ProposalContentDto,
    flag: ProposalActionFlag,
  ) => {
    if (!content.id) return;
    try {
      await proposalService.actOnProposalContent(proposalId, content.id, flag);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to update proposal content";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const handleExportProposals = () => {
    const filename = `proposals_${sessionSource?.toLowerCase()}_${sessionIdOrKey}_${
      new Date().toISOString().split("T")[0]
    }`;
    downloadAsJson(proposals, filename);
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100%",
        ...scrollBarSx,
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box sx={{ width: "70%", py: 2 }}>
          {loadingProposals ? (
            <LoadingSpinner />
          ) : proposals.length === 0 ? (
            <Typography color="text.secondary" textAlign="center">
              No proposals found for this connection.
            </Typography>
          ) : (
            <Stack spacing={2}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExportProposals}
                >
                  Export to JSON
                </Button>
              </Box>

              {proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onProposalAction={handleProposalAction}
                  onProposalContentAction={handleProposalContentAction}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Box>
      <AppSnackbar
        open={showError}
        message={error}
        onClose={() => setShowError(false)}
      />
    </Box>
  );
};

export default ProposalSessionItemPage;
