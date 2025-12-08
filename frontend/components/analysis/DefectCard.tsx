import { DefectDto } from "@/types/analysis";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import StoryChip from "../StoryChip";
import DefectChip from "../DefectChip";

interface DefectCardProps {
  defect: DefectDto;
  onMarkSolved: (defectId: string, flag: boolean) => void;
}

const getSeverityColor = (severity?: string) => {
  switch (severity?.toUpperCase()) {
    case "HIGH":
      return "error";
    case "MEDIUM":
      return "warning";
    case "LOW":
      return "info";
    default:
      return "default";
  }
};

const DefectCard: React.FC<DefectCardProps> = ({ defect, onMarkSolved }) => {
  return (
    <Card
      key={defect.id}
      elevation={1}
      sx={{
        borderRadius: 1,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: 2,
            mb: 2,
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
            <DefectChip defectKey={defect.key} />
            {defect.type && <Chip label={defect.type} size="small" />}
            {defect.severity && (
              <Chip
                label={`Severity: ${defect.severity}`}
                size="small"
                color={getSeverityColor(defect.severity)}
              />
            )}
            {typeof defect.confidence === "number" && (
              <Chip
                label={`Confidence: ${(defect.confidence * 100).toFixed(0)}%`}
                size="small"
                // sx={{ backgroundColor: "grey.200" }}
              />
            )}
          </Box>
          <Button
            size="small"
            variant={defect.solved ? "outlined" : "contained"}
            color={defect.solved ? "success" : "primary"}
            onClick={() => onMarkSolved(defect.id, !defect.solved)}
          >
            {defect.solved ? "Mark Unsolved" : "Mark Solved"}
          </Button>
        </Box>
        <Stack direction="column" spacing={2} sx={{ mt: 2, mb: 1 }}>
          {defect.explanation && (
            <Typography variant="body1" sx={{ mt: 1 }}>
              Explanation:
              <Typography
                variant="body2"
                color="text.secondary"
                component="span"
                sx={{ whiteSpace: "pre-line", ml: 1 }}
              >
                {defect.explanation}
              </Typography>
            </Typography>
          )}
          {defect.suggested_fix && (
            <Typography variant="body1" sx={{ mt: 1 }}>
              Suggested Fix:
              <Typography
                variant="body2"
                color="text.secondary"
                component="span"
                sx={{ whiteSpace: "pre-line", ml: 1 }}
              >
                {defect.suggested_fix}
              </Typography>
            </Typography>
          )}
          {defect.story_keys && defect.story_keys.length > 0 && (
            <Stack
              direction="column"
              spacing={1}
              sx={{ mt: 1 }}
              flexWrap="wrap"
            >
              <Typography variant="body1" sx={{ mt: 1 }}>
                Work Items:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                {defect.story_keys.map((key) => (
                  <StoryChip storyKey={key} size="small" />
                ))}
              </Box>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default DefectCard;
