import { DefectDto } from "../types/defect";
import {
  Box,
  Stack,
  Tag,
  TagGroup,
  Text,
  Checkbox,
  Inline,
} from "@forge/react";

const DefectItem = ({
  defect,
  onSolvedChange,
  getIssueLink,
}: {
  defect: DefectDto;
  onSolvedChange: (id: string, solved: boolean) => void;
  getIssueLink: (id: string) => string;
}) => {
  let severityColor: "green" | "yellow" | "red";
  switch (defect.severity.toLocaleLowerCase()) {
    case "low":
      severityColor = "green";
      break;
    case "medium":
      severityColor = "yellow";
      break;
    case "high":
      severityColor = "red";
      break;
    default:
      severityColor = "red";
      break;
  }

  return (
    <Box
      xcss={{
        padding: "space.100",
        width: "100%",
        ":hover": {
          backgroundColor: "color.background.accent.lime.subtlest",
        },
        borderRadius: "border.radius",
        backgroundColor: "elevation.surface.raised",
        boxShadow: "elevation.shadow.raised",
        opacity: defect.solved ? "opacity.disabled" : undefined,
      }}
    >
      <Stack>
        <TagGroup>
          <Tag text={defect.type} color="red" />
          <Tag text={defect.severity} color={severityColor} />
          <Tag text={`Confidence: ${defect.confidence}`} color="orangeLight" />
        </TagGroup>
        <Box
          xcss={{
            padding: "space.050",
            // backgroundColor: "color.background.accent.orange.subtlest",
            borderRadius: "border.radius",
            marginBottom: "space.100",
          }}
        >
          {/* <Text size="large" weight="bold">
            Explanation
          </Text> */}
          <Text>{defect.explanation}</Text>
        </Box>
        <Box
          xcss={{
            padding: "space.050",
            backgroundColor: "color.background.accent.gray.subtlest",
            borderRadius: "border.radius",
          }}
        >
          <Text size="large" weight="bold">
            Suggested Fix
          </Text>

          <Text>{defect.suggestedFix}</Text>
        </Box>
        <Inline alignBlock="center" alignInline="center" spread="space-between">
          <TagGroup>
            {defect.workItemIds.map((item) => (
              <Tag text={item} href={getIssueLink(item)} color="tealLight" />
            ))}
          </TagGroup>
          <Checkbox
            label="Solved"
            isChecked={defect.solved}
            onChange={(e) =>
              onSolvedChange(defect.id, e.target.checked || false)
            }
          />
        </Inline>
      </Stack>
    </Box>
  );
};

const DefectSidebar = ({
  defects,
  onSolvedChange,
  getIssueLink,
}: {
  defects: DefectDto[];
  onSolvedChange: (id: string, solved: boolean) => void;
  getIssueLink: (id: string) => string;
}) => {
  return (
    <Stack space="space.100">
      {defects.map((item) => (
        <DefectItem
          defect={item}
          onSolvedChange={onSolvedChange}
          key={item.id}
          getIssueLink={getIssueLink}
        />
      ))}
    </Stack>
  );
};

export default DefectSidebar;
