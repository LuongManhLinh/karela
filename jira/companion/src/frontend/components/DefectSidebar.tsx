import { DefectDto } from "../types/defect";
import {
  Box,
  Button,
  Inline,
  Stack,
  Strong,
  Tag,
  TagGroup,
  Text,
  xcss,
} from "@forge/react";

const cardStyle = xcss({
  padding: "space.100",
  width: "100%",
  ":hover": {
    backgroundColor: "color.background.accent.lime.subtlest",
  },
});

const DefectItem = ({ defect }: { defect: DefectDto }) => {
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
    <Box xcss={cardStyle}>
      <Stack>
        <TagGroup>
          <Tag text={defect.type} color="red" />
          <Tag text={defect.severity} color={severityColor} />
          <Tag text={`Confidence: ${defect.confidence}`} color="orangeLight" />
        </TagGroup>
        <Box
          xcss={{
            padding: "space.050",
          }}
        >
          <Text>{defect.explanation}</Text>
        </Box>
        <Box
          xcss={{
            padding: "space.050",
          }}
        >
          <Text weight="bold">{defect.suggestedImprovements}</Text>
        </Box>
        <TagGroup>
          {defect.workItemIds.map((item) => (
            <Tag text={item} href="https://youtube.com" color="tealLight" />
          ))}
        </TagGroup>
      </Stack>
    </Box>
  );
};

const DefectSidebar = ({ defects }: { defects: DefectDto[] }) => {
  return (
    <Stack space="space.100">
      {defects.map((item) => (
        <DefectItem defect={item} key={item.id} />
      ))}
    </Stack>
  );
};

export default DefectSidebar;
