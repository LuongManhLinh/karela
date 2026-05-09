import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from "@mui/material";
import type { DefectDto } from "@/types/analysis";
import DefectCard from "@/components/analysis/DefectCard";

interface DefectDialogProps {
  open: boolean;
  onClose: () => void;
  defects: DefectDto[];
  proposalKey?: string;
  onMarkSolved: (defectId: string, solved: boolean) => void;
  onStoriesClick: (storyKeys: string[]) => void;
  onProposalLinkClick: (defectKey: string, useSwitchAndScroll: boolean) => void;
}

export const DefectDialog: React.FC<DefectDialogProps> = ({
  open,
  onClose,
  defects,
  proposalKey,
  onMarkSolved,
  onStoriesClick,
  onProposalLinkClick,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{`Defects for ${proposalKey || ""}`}</DialogTitle>
      <DialogContent dividers>
        {defects.length === 0 ? (
          <Typography color="text.secondary">No defects found</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {defects.map((defect) => (
              <DefectCard
                key={defect.id}
                defect={defect}
                onMarkSolved={onMarkSolved}
                onStoriesClick={onStoriesClick}
                onProposalLinkClick={onProposalLinkClick}
              />
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
