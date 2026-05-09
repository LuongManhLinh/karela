import React from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ProposalCard } from "@/components/proposals/ProposalCard";
import type {
  ProposalDto,
  ProposalContentDto,
  ProposalActionFlag,
} from "@/types/proposal";

interface ProposalTabProps {
  showLoading: boolean;
  showNoGenerated: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  proposalRefs: Record<string, HTMLDivElement | null>;
  proposals: ProposalDto[];
  isGenerating: boolean;
  onProposalAction: (proposalId: string, flag: ProposalActionFlag) => void;
  onProposalContentAction: (
    proposalId: string,
    content: ProposalContentDto,
    flag: ProposalActionFlag,
  ) => void;
  onProposalContentClick: (content: ProposalContentDto) => void;
  onTargetDefectClick: (
    proposalKey: string,
    defectKey: string,
    useSwitchAndScroll: boolean,
  ) => void;
  highlightedProposalKey: string | null;
}

export const ProposalTab: React.FC<ProposalTabProps> = ({
  showLoading,
  showNoGenerated,
  containerRef,
  proposalRefs,
  proposals,
  isGenerating,
  onProposalAction,
  onProposalContentAction,
  onProposalContentClick,
  onTargetDefectClick,
  highlightedProposalKey,
}) => {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {showLoading ? (
        <LoadingSpinner />
      ) : showNoGenerated ? (
        <Typography color="text.secondary">No proposals generated</Typography>
      ) : (
        <Box
          ref={containerRef}
          sx={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            gap: 2,
            overflowY: "auto",
            minHeight: 0,
            p: 2,
          }}
        >
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
          {proposals.map((proposal) => (
            <Box
              key={proposal.id}
              ref={(el: HTMLDivElement) => {
                proposalRefs[proposal.key] = el;
              }}
            >
              <ProposalCard
                proposal={proposal}
                onProposalAction={onProposalAction}
                onProposalContentAction={onProposalContentAction}
                onProposalContentClick={onProposalContentClick}
                onTargetDefectClick={(defectKey, useSwitchAndScroll) =>
                  onTargetDefectClick(
                    proposal.key,
                    defectKey,
                    useSwitchAndScroll,
                  )
                }
                highlight={proposal.key === highlightedProposalKey}
                defaultExpanded={proposal.accepted === null}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
