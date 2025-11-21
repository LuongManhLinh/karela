"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
import { ExpandMore, Check, Close, Undo } from "@mui/icons-material";
import { chatService } from "@/services/chatService";
import type { ChatProposalDto } from "@/types";

interface ProposalDisplayProps {
  proposal: ChatProposalDto;
  sessionId: string;
  onUpdate: () => void;
}

export const ProposalDisplay: React.FC<ProposalDisplayProps> = ({
  proposal,
  sessionId,
  onUpdate,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await chatService.acceptProposal(sessionId, parseInt(proposal.id));
      onUpdate();
    } catch (err) {
      console.error("Failed to accept proposal:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await chatService.rejectProposal(sessionId, parseInt(proposal.id));
      onUpdate();
    } catch (err) {
      console.error("Failed to reject proposal:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async () => {
    setLoading(true);
    try {
      await chatService.revertProposal(sessionId, parseInt(proposal.id));
      onUpdate();
    } catch (err) {
      console.error("Failed to revert proposal:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "CREATE":
        return "success";
      case "UPDATE":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusColor = () => {
    if (proposal.accepted === true) return "success";
    if (proposal.accepted === false) return "error";
    return "warning";
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{
        borderRadius: 2,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        "&:before": {
          display: "none",
        },
        mb: 2,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          borderRadius: expanded ? "8px 8px 0 0" : "8px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            width: "100%",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Change Proposal
          </Typography>
          <Chip
            label={proposal.type}
            size="small"
            color={getTypeColor(proposal.type)}
            sx={{ borderRadius: 1.5 }}
          />
          {proposal.accepted !== null && (
            <Chip
              label={proposal.accepted ? "Accepted" : "Rejected"}
              size="small"
              color={getStatusColor()}
              sx={{ borderRadius: 1.5 }}
            />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {proposal.contents.map((content, index) => (
            <Card
              key={index}
              elevation={1}
              sx={{
                borderRadius: 2,
                bgcolor: "background.paper",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Story Key: {content.story_key || "N/A"}
                </Typography>
                {content.summary && (
                  <Typography variant="body2" paragraph>
                    <strong>Summary:</strong> {content.summary}
                  </Typography>
                )}
                {content.description && (
                  <Typography variant="body2" paragraph>
                    <strong>Description:</strong> {content.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              justifyContent: "flex-end",
              mt: 1,
            }}
          >
            {proposal.accepted === null && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Check />}
                  onClick={handleAccept}
                  disabled={loading}
                >
                  Accept
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Close />}
                  onClick={handleReject}
                  disabled={loading}
                >
                  Reject
                </Button>
              </>
            )}
            {proposal.accepted === true && proposal.type === "UPDATE" && (
              <Button
                variant="outlined"
                startIcon={<Undo />}
                onClick={handleRevert}
                disabled={loading}
              >
                Revert
              </Button>
            )}
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
