"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { ExpandMore, Check, Close, Undo } from "@mui/icons-material";
import type {
  ProposalActionFlag,
  ProposalContentDto,
  ProposalDto,
} from "@/types/proposal";

interface ProposalCardProps {
  proposal: ProposalDto;
  onProposalAction?: (
    proposalId: string,
    flag: ProposalActionFlag
  ) => Promise<void> | void;
  onProposalContentAction?: (
    proposalId: string,
    content: ProposalContentDto,
    flag: ProposalActionFlag
  ) => Promise<void> | void;
  defaultExpanded?: boolean;
}

const statusChip = (value?: boolean | null) => {
  if (value === true) {
    return <Chip label="Accepted" color="success" size="small" />;
  }
  if (value === false) {
    return <Chip label="Rejected" color="error" size="small" />;
  }
  return <Chip label="Pending" color="warning" size="small" />;
};

const typeChipColor = (type: string) => {
  switch (type) {
    case "CREATE":
      return "success";
    case "UPDATE":
      return "info";
    default:
      return "default";
  }
};

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  onProposalAction,
  onProposalContentAction,
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [loadingTarget, setLoadingTarget] = useState<string | null>(null);

  const runWithLoading = async (
    key: string,
    fn: () => Promise<void> | void
  ) => {
    setLoadingTarget(key);
    try {
      await fn();
    } finally {
      setLoadingTarget(null);
    }
  };

  const handleProposalAction = async (flag: ProposalActionFlag) => {
    if (!onProposalAction) return;
    await runWithLoading(`proposal-${flag}`, () =>
      onProposalAction(proposal.id, flag)
    );
  };

  const handleContentAction = async (
    content: ProposalContentDto,
    flag: ProposalActionFlag
  ) => {
    if (!onProposalContentAction || !content.id) return;
    await runWithLoading(`content-${content.id}-${flag}`, () =>
      onProposalContentAction(proposal.id, content, flag)
    );
  };

  const renderActionButtons = (
    accepted?: boolean | null,
    onAccept?: () => Promise<void> | void,
    onReject?: () => Promise<void> | void,
    onRevert?: () => Promise<void> | void,
    loadingKey?: string,
    acceptButtonText: string = "Accept",
    rejectButtonText: string = "Reject",
    revertButtonText: string = "Revert"
  ) => {
    return (
      <Stack direction="row" spacing={1}>
        {accepted === null && (
          <>
            <Button
              size="small"
              startIcon={<Check />}
              color="success"
              variant="contained"
              disabled={!onAccept || loadingTarget === loadingKey}
              onClick={onAccept}
            >
              {acceptButtonText}
            </Button>
            <Button
              size="small"
              startIcon={<Close />}
              color="error"
              variant="contained"
              disabled={!onReject || loadingTarget === loadingKey}
              onClick={onReject}
            >
              {rejectButtonText}
            </Button>
          </>
        )}
        {accepted === true && (
          <Button
            size="small"
            startIcon={<Undo />}
            variant="outlined"
            disabled={!onRevert || loadingTarget === loadingKey}
            onClick={onRevert}
          >
            {revertButtonText}
          </Button>
        )}
      </Stack>
    );
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded((prev) => !prev)}
      sx={{
        borderRadius: 1,
        bgcolor: "background.paper",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMore fontSize="medium" />}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          width={"100%"}
          paddingInlineEnd={1}
        >
          <Stack direction="row" spacing={1} alignItems="center" flexGrow={1}>
            <Typography variant="h6">Proposal</Typography>
            <Chip
              label={proposal.source}
              size="small"
              color={proposal.source === "CHAT" ? "primary" : "secondary"}
            />
            <Chip
              label={`${proposal.contents.length} change${
                proposal.contents.length === 1 ? "" : "s"
              }`}
              size="small"
              color="default"
            />
            {proposal.accepted !== undefined && statusChip(proposal.accepted)}
          </Stack>
          {renderActionButtons(
            proposal.accepted ?? null,
            () => handleProposalAction(1),
            () => handleProposalAction(0),
            () => handleProposalAction(-1),
            "proposal",
            "Accept All",
            "Reject All",
            "Revert All"
          )}
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack direction="column">
          <Typography variant="body2" color="text.secondary">
            Project: {proposal.project_key}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Created {new Date(proposal.created_at).toLocaleString()}
          </Typography>
        </Stack>

        <Stack spacing={2}>
          {proposal.contents.map((content, index) => (
            <Card
              key={content.id || `${proposal.id}-${index}`}
              variant="outlined"
            >
              <CardContent>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    <Chip
                      label={content.type}
                      size="small"
                      color={typeChipColor(content.type) as any}
                    />
                    {statusChip(content.accepted)}
                    {content.key && (
                      <Chip
                        label={content.key}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                  {renderActionButtons(
                    content.accepted || null,
                    content.id
                      ? () => handleContentAction(content, 1)
                      : undefined,
                    content.id
                      ? () => handleContentAction(content, 0)
                      : undefined,
                    content.id
                      ? () => handleContentAction(content, -1)
                      : undefined,
                    content.id ? `content-${content.id}` : undefined
                  )}
                </Stack>
                <Stack direction="column" spacing={2} sx={{ mt: 2, mb: 1 }}>
                  {content.explanation && (
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Explanation:
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        component="span"
                        sx={{ whiteSpace: "pre-line", ml: 1 }}
                      >
                        {content.explanation}
                      </Typography>
                    </Typography>
                  )}
                  {content.summary && (
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Summary:
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        component="span"
                        sx={{ whiteSpace: "pre-line", ml: 1 }}
                      >
                        {content.summary}
                      </Typography>
                    </Typography>
                  )}
                  {content.description && (
                    <Stack direction="column" spacing={1} sx={{ mt: 1 }}>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        Description:
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ whiteSpace: "pre-line", mt: 1 }}
                      >
                        {content.description}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};
