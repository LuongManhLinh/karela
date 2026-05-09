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
import {
  ProposalDto,
  ProposalContentDto,
  ProposalActionFlag,
} from "@/types/proposal";
import { ProposalCard } from "@/components/proposals/ProposalCard";

interface ProposalDialogProps {
  open: boolean;
  onClose: () => void;
  proposals: ProposalDto[];
  defectKey?: string;
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
}

export const ProposalDialog: React.FC<ProposalDialogProps> = ({
  open,
  onClose,
  proposals,
  defectKey,
  onProposalAction,
  onProposalContentAction,
  onProposalContentClick,
  onTargetDefectClick,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{`Proposals for ${defectKey || ""}`}</DialogTitle>
      <DialogContent dividers>
        {proposals.length === 0 ? (
          <Typography color="text.secondary">No proposals generated</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onProposalAction={onProposalAction}
                onProposalContentAction={onProposalContentAction}
                onProposalContentClick={onProposalContentClick}
                onTargetDefectClick={(defectKeyParam, useSwitch) =>
                  onTargetDefectClick(proposal.key, defectKeyParam, useSwitch)
                }
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
