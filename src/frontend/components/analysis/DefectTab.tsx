import React from "react";
import { Box, Stack, Skeleton, Typography } from "@mui/material";
import DefectCard from "@/components/analysis/DefectCard";
import type { AnalysisDto, DefectDto } from "@/types/analysis";

interface DefectTabProps {
  selectedAnalysis: AnalysisDto;
  defectsContainerRef: React.RefObject<HTMLDivElement | null>;
  defectRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onMarkSolved: (defectId: string, solved: boolean) => void;
  onStoriesClick: (storyKeys: string[]) => void;
  onProposalLinkClick: (defectKey: string, useSwitchAndScroll: boolean) => void;
  highlightedDefectKey: string | null;
}

export const DefectTab: React.FC<DefectTabProps> = ({
  selectedAnalysis,
  defectsContainerRef,
  defectRefs,
  onMarkSolved,
  onStoriesClick,
  onProposalLinkClick,
  highlightedDefectKey,
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
      {selectedAnalysis.status === "IN_PROGRESS" ||
      selectedAnalysis.status === "PENDING" ? (
        <Stack gap={2} direction="column">
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
        </Stack>
      ) : selectedAnalysis.defects.length === 0 ? (
        <Typography color="text.secondary">No defects found</Typography>
      ) : (
        <Box
          ref={defectsContainerRef}
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
          {selectedAnalysis.defects.map((defect: DefectDto) => (
            <Box
              key={defect.id}
              ref={(el: HTMLDivElement) => {
                defectRefs.current[defect.key] = el;
              }}
            >
              <DefectCard
                defect={defect}
                onMarkSolved={onMarkSolved}
                onStoriesClick={onStoriesClick}
                onProposalLinkClick={onProposalLinkClick}
                highlight={defect.key === highlightedDefectKey}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
