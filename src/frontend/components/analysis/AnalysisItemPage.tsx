"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Skeleton,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useNotificationContext } from "@/providers/NotificationProvider";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ProposalCard } from "@/components/proposals/ProposalCard";
import type {
  ProposalContentDto,
  ProposalActionFlag,
  ProposalDto,
} from "@/types/proposal";
import DefectCard from "@/components/analysis/DefectCard";
import { downloadAsJson } from "@/utils/exportUtils";
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { scrollBarSx } from "@/constants/scrollBarSx";
import { MultiStoryDetailDialog } from "../StoryDialog";
import ProposalContentDiffDialog from "@/components/proposals/ProposalContentDiffDialog";
import { AnalysisDto, DefectDto } from "@/types/analysis";

export interface AnalysisItemPageProps {
  projectFilterKey?: string;
  storyFilterKey?: string;
  idOrKey: string;
}

const AnalysisItemPage: React.FC<AnalysisItemPageProps> = ({
  projectFilterKey,
  storyFilterKey,
  idOrKey,
}) => {
  const t = useTranslations("analysis.AnalysisItemPage");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: analysisDetailData, isLoading: isDetailsLoading } =
    useAnalysisDetailsQuery(idOrKey);

  const selectedAnalysisDetail = useMemo(
    () => analysisDetailData?.data || null,
    [analysisDetailData],
  );

  // Proposals
  const { data: proposalsData, isLoading: isProposalsLoading } =
    useSessionProposalsQuery(
      selectedAnalysisDetail?.key,
      "ANALYSIS",
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
  const { mutateAsync: generateProposals, isPending: isGeneratingMutation } =
    useGenerateProposalsMutation();
  const { mutateAsync: actOnProposal } = useActOnProposalMutation();
  const { mutateAsync: actOnProposalContent } =
    useActOnProposalContentMutation();

  const isGenerating =
    isGeneratingMutation || selectedAnalysisDetail?.generating_proposals;

  const { notify } = useNotificationContext();

  const [multiStoryDialogOpen, setMultiStoryDialogOpen] = useState(false);
  const [selectedStoryKeys, setSelectedStoryKeys] = useState<string[]>([]);

  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [selectedContentForDiff, setSelectedContentForDiff] =
    useState<ProposalContentDto | null>(null);

  const [activeTab, setActiveTab] = useState(0);

  const [highlightedProposalKey, setHighlightedProposalKey] = useState<
    string | null
  >(null);
  const [highlightedDefectKey, setHighlightedDefectKey] = useState<
    string | null
  >(null);

  const proposalHighlightTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const defectHighlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const proposalRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const defectRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const proposalsContainerRef = useRef<HTMLDivElement | null>(null);
  const defectsContainerRef = useRef<HTMLDivElement | null>(null);

  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const [proposalDialogDefectKey, setProposalDialogDefectKey] =
    useState<string>("");
  const [dialogProposals, setDialogProposals] = useState<ProposalDto[]>([]);

  const [defectDialogOpen, setDefectDialogOpen] = useState(false);
  const [defectDialogProposalKey, setDefectDialogProposalKey] =
    useState<string>("");
  const [dialogDefects, setDialogDefects] = useState<DefectDto[]>([]);

  const { subscribe, unsubscribe } = useWebSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    const analysisId = selectedAnalysisDetail?.id;
    if (!analysisId) return;

    const handleMessage = (data: any) => {
      if (data.id === analysisId) {
        // Invalidate details query to refresh status and defects
        queryClient.invalidateQueries({
          queryKey: ["analysis", "details", idOrKey],
        });
        // Also invalidate summaries to keep sidebar in sync
        queryClient.invalidateQueries({ queryKey: ["analysis", "summaries"] });

        if (data.proposal_ids) {
          // If proposal IDs are included, invalidate proposals query as well
          queryClient.invalidateQueries({
            queryKey: ["proposals", "session", analysisId],
          });
        }
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
      if (proposalHighlightTimerRef.current) {
        clearTimeout(proposalHighlightTimerRef.current);
      }
      if (defectHighlightTimerRef.current) {
        clearTimeout(defectHighlightTimerRef.current);
      }
    };
  }, []);

  const parseAnalysisHash = (hashValue: string) => {
    const hash = hashValue.startsWith("#") ? hashValue.slice(1) : hashValue;
    const [targetType, rawId] = hash.split(":");
    if (!rawId) return null;
    const id = decodeURIComponent(rawId);

    if (targetType === "proposal") {
      return { target: "proposal" as const, id };
    }
    if (targetType === "defect") {
      return { target: "defect" as const, id };
    }

    return null;
  };

  const buildAnalysisHash = (target: "proposal" | "defect", id: string) =>
    `#${target}:${encodeURIComponent(id)}`;

  const setProposalHighlight = (proposalKey: string) => {
    if (proposalHighlightTimerRef.current) {
      clearTimeout(proposalHighlightTimerRef.current);
    }
    setHighlightedProposalKey(proposalKey);
    proposalHighlightTimerRef.current = setTimeout(() => {
      setHighlightedProposalKey((current) =>
        current === proposalKey ? null : current,
      );
    }, 2000);
  };

  const setDefectHighlight = (defectKey: string) => {
    if (defectHighlightTimerRef.current) {
      clearTimeout(defectHighlightTimerRef.current);
    }
    setHighlightedDefectKey(defectKey);
    defectHighlightTimerRef.current = setTimeout(() => {
      setHighlightedDefectKey((current) =>
        current === defectKey ? null : current,
      );
    }, 2000);
  };

  const scrollToTargetNode = (
    getNode: () => HTMLDivElement | null,
    getContainer: () => HTMLDivElement | null,
    afterScroll: () => void,
    attempt = 0,
  ) => {
    const node = getNode();
    const container = getContainer();

    if (node && container) {
      const containerRect = container.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      const scrollTop =
        container.scrollTop + (nodeRect.top - containerRect.top);
      container.scrollTo({ top: scrollTop, behavior: "smooth" });
      afterScroll();
      return;
    }

    if (attempt >= 12) {
      return;
    }

    window.setTimeout(() => {
      requestAnimationFrame(() => {
        scrollToTargetNode(getNode, getContainer, afterScroll, attempt + 1);
      });
    }, 50);
  };

  const switchToProposalAndScroll = (proposalKey: string) => {
    setActiveTab(1);
    requestAnimationFrame(() => {
      scrollToTargetNode(
        () => proposalRefs.current[proposalKey],
        () => proposalsContainerRef.current,
        () => setProposalHighlight(proposalKey),
      );
    });
  };

  const switchToDefectAndScroll = (defectKey: string) => {
    setActiveTab(0);
    requestAnimationFrame(() => {
      scrollToTargetNode(
        () => defectRefs.current[defectKey],
        () => defectsContainerRef.current,
        () => setDefectHighlight(defectKey),
      );
    });
  };

  const navigateWithHash = (target: "proposal" | "defect", id: string) => {
    const query = searchParams.toString();
    const hash = buildAnalysisHash(target, id);
    const destination = `${pathname}${query ? `?${query}` : ""}${hash}`;
    router.push(destination);

    // Next.js router updates history state, which may not trigger hashchange.
    // Apply switch-and-scroll immediately so ctrl-click works without reload.
    if (target === "proposal") {
      switchToProposalAndScroll(id);
      return;
    }

    switchToDefectAndScroll(id);
  };

  const applyHashNavigation = () => {
    const parsed = parseAnalysisHash(window.location.hash);
    if (!parsed) return;

    if (parsed.target === "proposal") {
      switchToProposalAndScroll(parsed.id);
      return;
    }

    switchToDefectAndScroll(parsed.id);
  };

  useEffect(() => {
    if (!selectedAnalysisDetail) return;

    applyHashNavigation();
    const onHashChange = () => applyHashNavigation();

    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [selectedAnalysisDetail, analysisProposals]);

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
      notify(errorMessage, { severity: "error" });
    }
  };

  const handleGenerateProposals = async () => {
    const analysisId = selectedAnalysisDetail?.id;
    if (!analysisId) return;
    try {
      await generateProposals(analysisId);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || t("errors.failedToStartProposalGen");
      notify(errorMessage, { severity: "error" });
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
      notify(errorMessage, { severity: "error" });
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
      notify(errorMessage, { severity: "error" });
    }
  };

  const handleRerunAnalysis = async () => {
    const analysisId = selectedAnalysisDetail?.id;
    if (!analysisId) return;
    try {
      await rerunAnalysis(analysisId);
      // Invalidation handles state update
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || t("errors.failedToRerunAnalysis");
      notify(errorMessage, { severity: "error" });
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

  const handleDefectProposalLinkClick = (
    defectKey: string,
    useSwitchAndScroll: boolean,
  ) => {
    const matchingProposals = analysisProposals.filter((proposal) =>
      proposal.target_defect_keys?.includes(defectKey),
    );

    if (matchingProposals.length === 0) {
      return;
    }

    const firstProposal = matchingProposals[0];
    if (useSwitchAndScroll) {
      navigateWithHash("proposal", firstProposal.key);
      return;
    }

    setProposalDialogDefectKey(defectKey);
    setDialogProposals(matchingProposals);
    setProposalDialogOpen(true);
  };

  const handleProposalDefectLinkClick = (
    proposalKey: string,
    defectKey: string,
    useSwitchAndScroll: boolean,
  ) => {
    const defects = selectedAnalysisDetail?.defects || [];
    const matchingDefect = defects.find((defect) => defect.key === defectKey);
    if (!matchingDefect) {
      return;
    }

    if (useSwitchAndScroll) {
      navigateWithHash("defect", matchingDefect.key);
      return;
    }

    setDefectDialogProposalKey(proposalKey);
    setDialogDefects([matchingDefect]);
    setDefectDialogOpen(true);
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

  const tabActions = (selectedAnalysis: AnalysisDto) => {
    if (activeTab === 0) {
      return (
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {selectedAnalysis.defects.length > 0 && (
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
      );
    }

    return (
      <Button
        variant="contained"
        onClick={handleGenerateProposals}
        disabled={isGenerating || selectedAnalysis.status === "IN_PROGRESS"}
      >
        {isGenerating ? t("generating") : t("generateFromDefects")}
      </Button>
    );
  };

  const defectTab = (selectedAnalysis: AnalysisDto) => (
    <Box
      sx={{
        flex: 1,
        display: "flex", // Added
        flexDirection: "column", // Added
        minHeight: 0, // Added: Forces constraint so child can scroll
      }}
    >
      {selectedAnalysis.defects.length === 0 ? (
        <Typography color="text.secondary">{t("noDefectsFound")}</Typography>
      ) : (
        <Box
          ref={defectsContainerRef}
          sx={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            gap: 2,
            overflowY: "auto", // Changed to overflowY for clarity
            minHeight: 0,
            pr: 1, // Optional: Add padding for scrollbar space
            pb: 1,
          }}
        >
          {selectedAnalysis.defects.map((defect) => (
            <Box
              key={defect.id}
              ref={(el: HTMLDivElement) => {
                defectRefs.current[defect.key] = el;
              }}
            >
              <DefectCard
                defect={defect}
                onMarkSolved={handleMarkSolved}
                onStoriesClick={handleDefectCardStoriesClick}
                onProposalLinkClick={handleDefectProposalLinkClick}
                highlight={defect.key === highlightedDefectKey}
              />
            </Box>
          ))}

          {/* Moved Skeletons inside the scrollable area so they scroll too */}
          {(selectedAnalysis.status === "IN_PROGRESS" ||
            selectedAnalysis.status === "PENDING") && (
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
  );

  const proposalTab = (selectedAnalysis: AnalysisDto) => (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
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
            pb: 1,
          }}
        >
          {analysisProposals.map((proposal) => (
            <Box
              key={proposal.id}
              ref={(el: HTMLDivElement) => {
                proposalRefs.current[proposal.key] = el;
              }}
            >
              <ProposalCard
                proposal={proposal}
                onProposalAction={handleProposalAction}
                onProposalContentAction={handleProposalContentAction}
                onProposalContentClick={handleProposalContentClick}
                onTargetDefectClick={(defectKey, useSwitchAndScroll) =>
                  handleProposalDefectLinkClick(
                    proposal.key,
                    defectKey,
                    useSwitchAndScroll,
                  )
                }
                highlight={proposal.key === highlightedProposalKey}
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
  );

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100%",
        px: 2,
        overflow: "hidden", // Added: Prevents page-level scroll
      }}
    >
      {isDetailsLoading ? (
        <LoadingSpinner />
      ) : selectedAnalysisDetail ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            flex: 1,
            minHeight: 0,
            ...scrollBarSx,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexShrink: 0,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
            >
              <Tab
                label={t("defects")}
                sx={{ fontSize: "1rem", fontWeight: 600 }}
              />
              <Tab
                label={t("proposals")}
                sx={{ fontSize: "1rem", fontWeight: 600 }}
              />
            </Tabs>
            {tabActions(selectedAnalysisDetail)}
          </Box>
          <Box
            role="tabpanel"
            hidden={activeTab !== 0}
            sx={{
              flex: 1,
              display: activeTab === 0 ? "flex" : "none",
              flexDirection: "column",
              minHeight: 0,
              pt: 2,
            }}
          >
            {defectTab(selectedAnalysisDetail)}
          </Box>
          <Box
            role="tabpanel"
            hidden={activeTab !== 1}
            sx={{
              flex: 1,
              display: activeTab === 1 ? "flex" : "none",
              flexDirection: "column",
              minHeight: 0,
              pt: 2,
            }}
          >
            {proposalTab(selectedAnalysisDetail)}
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

      <MultiStoryDetailDialog
        open={multiStoryDialogOpen}
        onClose={handleCloseMultiStoryDialog}
        storyKeys={selectedStoryKeys}
      />
      <ProposalContentDiffDialog
        open={diffDialogOpen}
        onClose={handleCloseDiffDialog}
        content={selectedContentForDiff}
      />

      <Dialog
        open={proposalDialogOpen}
        onClose={() => setProposalDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {t("proposalDialogTitle", { defectKey: proposalDialogDefectKey })}
        </DialogTitle>
        <DialogContent dividers>
          {dialogProposals.length === 0 ? (
            <Typography color="text.secondary">
              {t("noProposalsGenerated")}
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {dialogProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onProposalAction={handleProposalAction}
                  onProposalContentAction={handleProposalContentAction}
                  onProposalContentClick={handleProposalContentClick}
                  onTargetDefectClick={(defectKey, useSwitchAndScroll) =>
                    handleProposalDefectLinkClick(
                      proposal.key,
                      defectKey,
                      useSwitchAndScroll,
                    )
                  }
                />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProposalDialogOpen(false)}>
            {t("close")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={defectDialogOpen}
        onClose={() => setDefectDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t("defectDialogTitle", { proposalKey: defectDialogProposalKey })}
        </DialogTitle>
        <DialogContent dividers>
          {dialogDefects.length === 0 ? (
            <Typography color="text.secondary">
              {t("noDefectsFound")}
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {dialogDefects.map((defect) => (
                <DefectCard
                  key={defect.id}
                  defect={defect}
                  onMarkSolved={handleMarkSolved}
                  onStoriesClick={handleDefectCardStoriesClick}
                  onProposalLinkClick={handleDefectProposalLinkClick}
                />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDefectDialogOpen(false)}>
            {t("close")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnalysisItemPage;
