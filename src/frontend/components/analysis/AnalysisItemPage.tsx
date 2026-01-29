"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
  Divider,
  Skeleton,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { AppSnackbar } from "@/components/AppSnackbar";
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
  useActOnProposalMutation,
  useActOnProposalContentMutation,
  useSessionProposalsQuery,
} from "@/hooks/queries/useProposalQueries";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocketContext } from "@/providers/WebSocketProvider";
import { useTranslations } from "next-intl";

import { scrollBarSx } from "@/constants/scrollBarSx";
import { MultiStoryDetailDialog } from "../StoryDialog";
import ProposalContentDiffDialog from "@/components/proposals/ProposalContentDiffDialog";

export interface AnalysisItemPageProps {
  connectionName: string;
  projectFilterKey?: string;
  storyFilterKey?: string;
  idOrKey: string;
}

const AnalysisItemPage: React.FC<AnalysisItemPageProps> = ({
  connectionName,
  projectFilterKey,
  storyFilterKey,
  idOrKey,
}) => {
  const t = useTranslations("analysis.AnalysisItemPage");
  const { data: analysisDetailData, isLoading: isDetailsLoading } =
    useAnalysisDetailsQuery(connectionName, idOrKey);
  const selectedAnalysisDetail = useMemo(
    () => analysisDetailData?.data || null,
    [analysisDetailData],
  );

  // Proposals
  const { data: proposalsData, isLoading: isProposalsLoading } =
    useSessionProposalsQuery(
      selectedAnalysisDetail?.id,
      "ANALYSIS",
      connectionName,
      projectFilterKey,
      storyFilterKey,
    );
  const analysisProposals = useMemo(
    () => proposalsData?.data || [],
    [proposalsData],
  );

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

  const [multiStoryDialogOpen, setMultiStoryDialogOpen] = useState(false);
  const [selectedStoryKeys, setSelectedStoryKeys] = useState<string[]>([]);

  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [selectedContentForDiff, setSelectedContentForDiff] =
    useState<ProposalContentDto | null>(null);

  const { subscribe, unsubscribe } = useWebSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    const analysisId = selectedAnalysisDetail?.id;
    if (!analysisId) return;

    const handleMessage = (data: any) => {
      console.log("Received WebSocket message for analysis:", data);
      if (data.id === analysisId) {
        // Invalidate details query to refresh status and defects
        queryClient.invalidateQueries({
          queryKey: ["analysis", "details", connectionName, idOrKey],
        });
        // Also invalidate summaries to keep sidebar in sync
        queryClient.invalidateQueries({ queryKey: ["analysis", "summaries"] });
      }
    };

    subscribe(`analysis:${analysisId}`, handleMessage);
    return () => unsubscribe(`analysis:${analysisId}`, handleMessage);
  }, [
    idOrKey,
    selectedAnalysisDetail?.id,
    subscribe,
    unsubscribe,
    queryClient,
  ]);

  const handleDefectCardStoriesClick = (storyKeys: string[]) => {
    setSelectedStoryKeys(storyKeys);
    setMultiStoryDialogOpen(true);
  };

  const handleCloseMultiStoryDialog = () => {
    setMultiStoryDialogOpen(false);
    setSelectedStoryKeys([]);
  };

  const handleProposalContentClick = (content: ProposalContentDto) => {
    setSelectedContentForDiff(content);
    setDiffDialogOpen(true);
  };

  const handleCloseDiffDialog = () => {
    setDiffDialogOpen(false);
    setSelectedContentForDiff(null);
  };

  const handleMarkSolved = async (defectId: string, solved: boolean) => {
    try {
      await markSolved({ defectId, solved });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || t("errors.failedToUpdateDefect");
      setError(errorMessage);
      setShowError(true);
    }
  };

  const handleGenerateProposals = async () => {
    const analysisId = selectedAnalysisDetail?.id;
    if (!analysisId) return;
    setError("");
    try {
      await generateProposals(analysisId);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || t("errors.failedToStartProposalGen");
      setError(errorMessage);
      setShowError(true);
    }
  };

  const handleProposalAction = async (
    proposalId: string,
    flag: ProposalActionFlag,
  ) => {
    if (!selectedAnalysisDetail?.id) return;
    try {
      await actOnProposal({ proposalId, flag });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || t("errors.failedToUpdateProposal");
      setError(errorMessage);
      setShowError(true);
    }
  };

  const handleProposalContentAction = async (
    proposalId: string,
    content: ProposalContentDto,
    flag: ProposalActionFlag,
  ) => {
    if (!selectedAnalysisDetail?.id || !content.id) return;
    try {
      await actOnProposalContent({ proposalId, contentId: content.id, flag });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || t("errors.failedToUpdateProposalContent");
      setError(errorMessage);
      setShowError(true);
    }
  };

  const handleRerunAnalysis = async () => {
    const analysisId = selectedAnalysisDetail?.id;
    if (!analysisId) return;
    setError("");

    try {
      await rerunAnalysis(analysisId);
      // Invalidation handles state update
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || t("errors.failedToRerunAnalysis");
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
      <Button variant="contained" onClick={handleRerunAnalysis}>
        {running ? t("analysisRunning") : t("rerunAnalysis")}
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
          ...scrollBarSx,
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
                  <Typography variant="h6">{t("defects")}</Typography>
                  <Stack direction="row" spacing={2}>
                    {selectedAnalysisDetail.defects.length > 0 && (
                      <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={handleExportDefects}
                      >
                        {t("exportToJson")}
                      </Button>
                    )}
                    {rerunButton()}
                  </Stack>
                </Stack>
                {selectedAnalysisDetail.defects.length === 0 ? (
                  <Typography color="text.secondary">
                    {t("noDefectsFound")}
                  </Typography>
                ) : (
                  selectedAnalysisDetail.defects.map((defect) => (
                    <DefectCard
                      key={defect.id}
                      defect={defect}
                      onMarkSolved={handleMarkSolved}
                      onStoriesClick={handleDefectCardStoriesClick}
                    />
                  ))
                )}
                {(selectedAnalysisDetail.status === "IN_PROGRESS" ||
                  selectedAnalysisDetail.status === "PENDING") && (
                  <Stack spacing={2}>
                    <Skeleton
                      variant="rectangular"
                      height={100}
                      sx={{ borderRadius: 2 }}
                    />
                    <Skeleton
                      variant="rectangular"
                      height={100}
                      sx={{ borderRadius: 2 }}
                    />
                    <Skeleton
                      variant="rectangular"
                      height={100}
                      sx={{ borderRadius: 2 }}
                    />
                  </Stack>
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
                  <Typography variant="h6">{t("proposals")}</Typography>
                  <Button
                    variant="contained"
                    onClick={handleGenerateProposals}
                    disabled={
                      isGenerating ||
                      selectedAnalysisDetail.status === "IN_PROGRESS"
                    }
                  >
                    {isGenerating ? t("generating") : t("generateFromDefects")}
                  </Button>
                </Stack>
                {isProposalsLoading ? (
                  <LoadingSpinner />
                ) : analysisProposals.length === 0 && !isGenerating ? (
                  <Typography color="text.secondary">
                    {t("noProposalsGenerated")}
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {analysisProposals.map((proposal) => (
                      <ProposalCard
                        key={proposal.id}
                        proposal={proposal}
                        onProposalAction={handleProposalAction}
                        onProposalContentAction={handleProposalContentAction}
                        onProposalContentClick={handleProposalContentClick}
                      />
                    ))}
                    {isGenerating && (
                      <>
                        <Skeleton
                          variant="rectangular"
                          height={120}
                          sx={{ borderRadius: 2 }}
                        />
                        <Skeleton
                          variant="rectangular"
                          height={120}
                          sx={{ borderRadius: 2 }}
                        />
                        <Skeleton
                          variant="rectangular"
                          height={120}
                          sx={{ borderRadius: 2 }}
                        />
                      </>
                    )}
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
                {t("errorOccurred")}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      <AppSnackbar
        open={showError}
        message={error}
        onClose={() => setShowError(false)}
      />
      <MultiStoryDetailDialog
        open={multiStoryDialogOpen}
        onClose={handleCloseMultiStoryDialog}
        connectionName={connectionName}
        storyKeys={selectedStoryKeys}
      />
      <ProposalContentDiffDialog
        open={diffDialogOpen}
        onClose={handleCloseDiffDialog}
        content={selectedContentForDiff}
        connectionName={connectionName}
      />
    </Box>
  );
};

export default AnalysisItemPage;
