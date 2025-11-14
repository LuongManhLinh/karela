import {
  Stack,
  Tag,
  Text,
  Button,
  Icon,
  Inline,
  Box,
  Heading,
  Lozenge,
  Pressable,
  Popup,
} from "@forge/react";
import { ChatProposalContentDto, ChatProposalDto } from "../types/chats";
import { useState } from "react";

const ProposalContent = ({
  proposalContent,
}: {
  proposalContent: ChatProposalContentDto;
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <Box
      // onClick={() => setExpanded(!expanded)}
      xcss={{
        padding: "space.100",
        backgroundColor: "color.background.neutral",
        borderRadius: "border.radius",
        ":hover": {
          backgroundColor: "color.background.neutral.hovered",
        },
      }}
    >
      <Stack space="space.100">
        <Inline
          alignBlock="center"
          alignInline="center"
          grow="fill"
          spread="space-between"
        >
          <Inline alignBlock="center" alignInline="center">
            <Icon glyph="story" label="Story" color="color.icon.accent.green" />
            <Text weight="bold">{proposalContent.story_key}</Text>
          </Inline>
          <Button appearance="subtle" onClick={() => setExpanded(!expanded)}>
            <Icon
              glyph={expanded ? "chevron-up" : "chevron-down"}
              label={expanded ? "Collapse" : "Expand"}
            />
          </Button>
        </Inline>

        {expanded && (
          <Box xcss={{ paddingLeft: "space.100" }}>
            <Stack space="space.200">
              {proposalContent.summary && (
                <Stack space="space.0" grow="hug">
                  <Text weight="bold" align="start">
                    Summary:
                  </Text>
                  <Text align="start">{proposalContent.summary}</Text>
                </Stack>
              )}

              {proposalContent.description && (
                <Stack space="space.0" grow="hug">
                  <Text weight="bold" align="start">
                    Description:
                  </Text>
                  <Text align="start">{proposalContent.description}</Text>
                </Stack>
              )}
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

const Proposal = ({ proposal }: { proposal: ChatProposalDto }) => {
  return (
    <Box
      xcss={{
        padding: "space.100",
        borderRadius: "border.radius",
        boxShadow: "elevation.shadow.raised",
        backgroundColor: "color.background.neutral.subtle",
      }}
    >
      <Stack space="space.050">
        <Inline
          alignInline="center"
          grow="fill"
          alignBlock="center"
          spread="space-between"
        >
          <Heading size="small">Project {proposal.project_key}</Heading>
          {proposal.accepted === null || proposal.accepted === undefined ? (
            <Inline>
              <Button
                appearance="subtle"
                onClick={() => {
                  console.log("Accept", proposal.id);
                }}
              >
                <Icon
                  glyph="check"
                  label="Accept"
                  color="color.icon.accent.green"
                />
              </Button>
              <Button
                appearance="subtle"
                onClick={() => {
                  console.log("Reject", proposal.id);
                }}
              >
                <Icon
                  glyph="cross"
                  label="Reject"
                  color="color.icon.accent.red"
                />
              </Button>
            </Inline>
          ) : proposal.accepted ? (
            <Lozenge appearance="success" isBold>
              Accepted
            </Lozenge>
          ) : (
            <Lozenge appearance="removed" isBold>
              Rejected
            </Lozenge>
          )}
        </Inline>
        {proposal.contents.map((content, index) => (
          <ProposalContent key={index} proposalContent={content} />
        ))}
      </Stack>
    </Box>
  );
};

const ProposalSection = ({ proposals }: { proposals: ChatProposalDto[] }) => {
  const [expanded, setExpanded] = useState(true);
  const section = () => (
    <Box
      xcss={{
        boxShadow: "elevation.shadow.overflow",
        backgroundColor: "elevation.surface",
        padding: "space.100",
      }}
    >
      <Stack space="space.100">
        <Pressable
          xcss={{
            backgroundColor: "elevation.surface",
            paddingLeft: "space.050",
            paddingRight: "space.050",
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Inline
            alignBlock="center"
            alignInline="center"
            grow="fill"
            spread="space-between"
          >
            <Text>
              {`${proposals.length} Change Proposal${
                proposals.length !== 1 ? "s" : ""
              }`}
            </Text>
            <Button appearance="subtle" onClick={() => setExpanded(!expanded)}>
              <Icon
                glyph={expanded ? "chevron-down" : "chevron-up"}
                label={expanded ? "Expand" : "Collapse"}
              />
            </Button>
          </Inline>
        </Pressable>
        {expanded &&
          proposals.map((proposal) => (
            <Proposal key={proposal.id} proposal={proposal} />
          ))}
      </Stack>
    </Box>
  );

  // return section();

  return (
    <Popup
      autoFocus={false}
      content={() => section()}
      isOpen={true}
      shouldFitContainer
      trigger={() => <></>}
    />
  );
};

export default ProposalSection;
