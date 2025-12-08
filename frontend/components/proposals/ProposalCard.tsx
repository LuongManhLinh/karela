"use client";

import React, { useMemo, useState } from "react";
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
import StoryChip from "../StoryChip";
import DefectChip from "../DefectChip";

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
    case "DELETE":
      return "error";
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

  const proposalAccepted = useMemo<boolean | null>(() => {
    // Accepted if all the contents are accepted
    let numAccepted = 0;
    let numRejected = 0;
    let numPending = 0;
    proposal.contents.forEach((content) => {
      if (content.accepted === true) numAccepted++;
      else if (content.accepted === false) numRejected++;
      else numPending++;
    });
    if (numAccepted === proposal.contents.length) return true;
    if (numRejected === proposal.contents.length) return false;
    return null;
  }, [proposal]);

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
        "&.Mui-expanded": {
          margin: "0",

          // 2. IMPORTANT: Re-apply the Stack's margin (space={1} = 8px by default)
          marginTop: (theme) => theme.spacing(1),
          marginBottom: (theme) => theme.spacing(1),
        },
        // The optional fix for the line/shadow:
        "&:before": {
          display: "none",
        },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMore fontSize="medium" />}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={1}
          alignItems="center"
          width={"100%"}
          paddingInlineEnd={1}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap", // items go to multiple rows
              gap: 1,
              flexGrow: 1, // expand to fill remaining space
            }}
          >
            <Chip label={proposal.key} size="medium" color="primary" />
            <Chip
              label={`Project: ${proposal.project_key}`}
              size="medium"
              color="secondary"
            />
            <Chip label={proposal.source} size="medium" color="info" />
            <Chip
              label={`${proposal.contents.length} change${
                proposal.contents.length === 1 ? "" : "s"
              }`}
              size="medium"
              color="default"
            />
          </Box>
          {renderActionButtons(
            proposalAccepted,
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
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap", // items go to multiple rows
              gap: 1,
              flexGrow: 1, // expand to fill remaining space
            }}
          >
            Target Defects:&nbsp;
            {proposal.target_defect_keys?.map((defKey) => (
              <DefectChip key={defKey} defectKey={defKey} />
            ))}
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ flexShrink: 0 }}
          >
            Created {new Date(proposal.created_at).toLocaleString()}
          </Typography>
        </Box>

        <Stack spacing={1}>
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
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap", // items go to multiple rows
                      gap: 1,
                      flexGrow: 1, // expand to fill remaining space
                    }}
                  >
                    {content.story_key && (
                      <StoryChip storyKey={content.story_key} size="small" />
                    )}
                    <Chip
                      label={content.type}
                      size="small"
                      color={typeChipColor(content.type) as any}
                    />
                    {statusChip(content.accepted)}
                  </Box>
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
