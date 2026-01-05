"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, Typography, Divider } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { ErrorSnackbar } from "@/components/ErrorSnackbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ProposalCard } from "@/components/proposals/ProposalCard";
import type { ProposalContentDto, ProposalActionFlag } from "@/types/proposal";
import DefectCard from "@/components/analysis/DefectCard";
import { downloadAsJson } from "@/utils/export_utils";
import {
  useAnalysisDetailsQuery,
  useRerunAnalysisMutation,
  useMarkDefectSolvedMutation,
  useGenerateProposalsMutation,
} from "@/hooks/queries/useAnalysisQueries";
import {
  useSessionProposalsQuery,
  useActOnProposalMutation,
  useActOnProposalContentMutation,
} from "@/hooks/queries/useProposalQueries";

import { useParams } from "next/navigation";

const AnalysisDetailPage: React.FC = () => {
  const { id } = useParams();

  const selectedAnalysisId = useMemo(() => {
    return typeof id === "string" ? id : null;
  }, [id]);

  const { data: analysisDetailData, isLoading: isDetailsLoading } =
    useAnalysisDetailsQuery(selectedAnalysisId);
  const selectedAnalysisDetail = analysisDetailData?.data || null;

  // Proposals
  const { data: proposalsData, isLoading: isProposalsLoading } =
    useSessionProposalsQuery(selectedAnalysisId || undefined, "ANALYSIS");
  const analysisProposals = proposalsData?.data || [];

  // Mutations
  const { mutateAsync: rerunAnalysis, isPending: isRerunning } =
    useRerunAnalysisMutation();
  const { mutateAsync: markSolved } = useMarkDefectSolvedMutation();
  const { mutateAsync: generateProposals, isPending: isGenerating } =
    useGenerateProposalsMutation();
  const { mutateAsync: actOnProposal } = useActOnProposalMutation();
  const { mutateAsync: actOnProposalContent } =
    useActOnProposalContentMutation();

  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  const handleMarkSolved = async (defectId: string, solved: boolean) => {
    try {
      await markSolved({ defectId, solved });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to update defect status";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const handleGenerateProposals = async () => {
    if (!selectedAnalysisId) return;
    try {
      await generateProposals(selectedAnalysisId);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to start proposal generation";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const handleProposalAction = async (
    proposalId: string,
    flag: ProposalActionFlag
  ) => {
    if (!selectedAnalysisId) return;
    try {
      await actOnProposal({ proposalId, flag });
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
    flag: ProposalActionFlag
  ) => {
    if (!selectedAnalysisId || !content.id) return;
    try {
      await actOnProposalContent({ proposalId, contentId: content.id, flag });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to update proposal content";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const handleRerunAnalysis = async () => {
    if (!selectedAnalysisId) return;
    setError("");

    try {
      await rerunAnalysis(selectedAnalysisId);
      // Invalidation handles state update
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to rerun analysis";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const handleExportDefects = () => {
    if (!selectedAnalysisDetail || selectedAnalysisDetail.defects.length === 0)
      return;
    const filename = `defects_${selectedAnalysisDetail.key}_${
      new Date().toISOString().split("T")[0]
    }`;
    downloadAsJson(selectedAnalysisDetail.defects, filename);
  };

  const rerunButton = () => {
    const running =
      isRerunning ||
      selectedAnalysisDetail?.status === "PENDING" ||
      selectedAnalysisDetail?.status === "IN_PROGRESS";
    return (
      <Button
        variant="contained"
        onClick={handleRerunAnalysis}
        disabled={selectedAnalysisId !== null}
      >
        {running ? "Analysis Running..." : "Rerun Analysis"}
      </Button>
    );
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
        position: "relative",
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          scrollbarColor: "#6b6b6b transparent",
          scrollbarWidth: "auto",
        }}
      >
        <Box sx={{ width: "70%", py: 2 }}>
          {isDetailsLoading ? (
            <LoadingSpinner />
          ) : selectedAnalysisDetail ? (
            <Stack spacing={3}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6">Defects</Typography>
                  <Stack direction="row" spacing={2}>
                    {selectedAnalysisDetail.defects.length > 0 && (
                      <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={handleExportDefects}
                      >
                        Export to JSON
                      </Button>
                    )}
                    {rerunButton()}
                  </Stack>
                </Stack>
                {selectedAnalysisDetail.defects.length === 0 ? (
                  <Typography color="text.secondary">
                    No defects found in this analysis.
                  </Typography>
                ) : (
                  selectedAnalysisDetail.defects.map((defect) => (
                    <DefectCard
                      key={defect.id}
                      defect={defect}
                      onMarkSolved={handleMarkSolved}
                    />
                  ))
                )}
              </Stack>
              <Divider />
              <Box>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6">Proposals</Typography>
                  <Button
                    variant="contained"
                    onClick={handleGenerateProposals}
                    disabled={
                      isGenerating ||
                      selectedAnalysisDetail.status === "IN_PROGRESS"
                    }
                  >
                    {isGenerating ? "Generating..." : "Generate from defects"}
                  </Button>
                </Stack>
                {isProposalsLoading ? (
                  <LoadingSpinner />
                ) : analysisProposals.length === 0 ? (
                  <Typography color="text.secondary">
                    No proposals generated yet.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {analysisProposals.map((proposal) => (
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
              <Box sx={{ height: 100 }} />
            </Stack>
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Typography color="text.secondary" variant="h5">
                Oops! Some error occurred. Please reload the page.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      <ErrorSnackbar
        open={showError}
        message={error}
        onClose={() => setShowError(false)}
      />
    </Box>
  );
};

export default AnalysisDetailPage;
