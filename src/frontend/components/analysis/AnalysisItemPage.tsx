"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Typography, Skeleton } from "@mui/material";
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

  const [highlightedProposalId, setHighlightedProposalId] = useState<
    string | null
  >(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const proposalRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const proposalsContainerRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

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

  const handleProposalLinkClick = (defectKey: string) => {
    const matchingProposals = analysisProposals.filter((proposal) =>
      proposal.target_defect_keys?.includes(defectKey),
    );

    if (matchingProposals.length > 0) {
      const proposalToHighlight = matchingProposals[0];
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      setHighlightedProposalId(proposalToHighlight.id);

      requestAnimationFrame(() => {
        const node = proposalRefs.current[proposalToHighlight.id];
        const container = proposalsContainerRef.current;
        if (node && container) {
          const containerRect = container.getBoundingClientRect();
          const nodeRect = node.getBoundingClientRect();
          const scrollTop =
            container.scrollTop + (nodeRect.top - containerRect.top);
          container.scrollTo({ top: scrollTop, behavior: "smooth" });
        }
      });

      highlightTimerRef.current = setTimeout(() => {
        setHighlightedProposalId((current) =>
          current === proposalToHighlight.id ? null : current,
        );
      }, 2000);
    }
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
        p: 2,
        overflow: "hidden", // Added: Prevents page-level scroll
      }}
    >
      {isDetailsLoading ? (
        <LoadingSpinner />
      ) : selectedAnalysisDetail ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            flex: 1,
            minHeight: 0, // Added: Vital for nested scrolling
            ...scrollBarSx,
          }}
        >
          {/* // Left: Defects */}
          <Box
            sx={{
              flex: 1,
              display: "flex", // Added
              flexDirection: "column", // Added
              minHeight: 0, // Added: Forces constraint so child can scroll
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", md: "center" },
                mb: 2,
                flexShrink: 0, // Added: Ensures header doesn't squash
              }}
            >
              <Typography variant="h6">{t("defects")}</Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
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
              </Box>
            </Box>
            {selectedAnalysisDetail.defects.length === 0 ? (
              <Typography color="text.secondary">
                {t("noDefectsFound")}
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flex: 1,
                  flexDirection: "column",
                  gap: 2,
                  overflowY: "auto", // Changed to overflowY for clarity
                  minHeight: 0,
                  pr: 1, // Optional: Add padding for scrollbar space
                }}
              >
                {selectedAnalysisDetail.defects.map((defect) => (
                  <DefectCard
                    key={defect.id}
                    defect={defect}
                    onMarkSolved={handleMarkSolved}
                    onStoriesClick={handleDefectCardStoriesClick}
                    onProposalLinkClick={handleProposalLinkClick}
                  />
                ))}

                {/* Moved Skeletons inside the scrollable area so they scroll too */}
                {(selectedAnalysisDetail.status === "IN_PROGRESS" ||
                  selectedAnalysisDetail.status === "PENDING") && (
                  <>
                    <Skeleton
                      variant="rectangular"
                      height={100}
                      sx={{ borderRadius: 2, flexShrink: 0 }}
                    />
                    <Skeleton
                      variant="rectangular"
                      height={100}
                      sx={{ borderRadius: 2, flexShrink: 0 }}
                    />
                    <Skeleton
                      variant="rectangular"
                      height={100}
                      sx={{ borderRadius: 2, flexShrink: 0 }}
                    />
                  </>
                )}
              </Box>
            )}
          </Box>

          {/* // Right: Proposals */}
          <Box
            sx={{
              ml: 4,
              flex: 1,
              display: "flex", // Added
              flexDirection: "column", // Added
              minHeight: 0, // Added
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", md: "center" },
                mb: 2,
                flexShrink: 0, // Added
              }}
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
            </Box>
            {isProposalsLoading ? (
              <LoadingSpinner />
            ) : analysisProposals.length === 0 && !isGenerating ? (
              <Typography color="text.secondary">
                {t("noProposalsGenerated")}
              </Typography>
            ) : (
              <Box
                ref={proposalsContainerRef}
                sx={{
                  display: "flex",
                  flex: 1,
                  flexDirection: "column",
                  gap: 2,
                  overflowY: "auto", // Changed to overflowY
                  minHeight: 0,
                  pr: 1,
                }}
              >
                {analysisProposals.map((proposal) => (
                  <Box
                    key={proposal.id}
                    ref={(el: HTMLDivElement) => {
                      proposalRefs.current[proposal.id] = el;
                    }}
                  >
                    <ProposalCard
                      proposal={proposal}
                      onProposalAction={handleProposalAction}
                      onProposalContentAction={handleProposalContentAction}
                      onProposalContentClick={handleProposalContentClick}
                      highlight={proposal.id === highlightedProposalId}
                    />
                  </Box>
                ))}
                {isGenerating && (
                  <>
                    <Skeleton
                      variant="rectangular"
                      height={120}
                      sx={{ borderRadius: 2, flexShrink: 0 }}
                    />
                    <Skeleton
                      variant="rectangular"
                      height={120}
                      sx={{ borderRadius: 2, flexShrink: 0 }}
                    />
                    <Skeleton
                      variant="rectangular"
                      height={120}
                      sx={{ borderRadius: 2, flexShrink: 0 }}
                    />
                  </>
                )}
              </Box>
            )}
          </Box>
        </Box>
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
