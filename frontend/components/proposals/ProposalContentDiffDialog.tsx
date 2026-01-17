"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Switch,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DifferenceIcon from "@mui/icons-material/Difference";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import { StoryDto } from "@/types/integration";
import { ProposalContentDto } from "@/types/proposal";
import { userService } from "@/services/userService";
import StoryChip from "../StoryChip";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { MarkdownMessage } from "../chat/MarkdownMessage";

type ViewMode = "diff" | "compare";

interface ProposalContentDiffDialogProps {
  open: boolean;
  onClose: () => void;
  content: ProposalContentDto | null;
  connectionId: string;
  projectKey: string;
}

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
}

// Simple diff algorithm for text comparison
const computeDiff = (oldText: string, newText: string): DiffLine[] => {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const result: DiffLine[] = [];

  // Simple LCS-based diff
  const lcs = computeLCS(oldLines, newLines);

  let oldIdx = 0;
  let newIdx = 0;
  let lcsIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (lcsIdx < lcs.length) {
      // Remove old lines until we hit the LCS
      while (oldIdx < oldLines.length && oldLines[oldIdx] !== lcs[lcsIdx]) {
        result.push({ type: "removed", content: oldLines[oldIdx] });
        oldIdx++;
      }
      // Add new lines until we hit the LCS
      while (newIdx < newLines.length && newLines[newIdx] !== lcs[lcsIdx]) {
        result.push({ type: "added", content: newLines[newIdx] });
        newIdx++;
      }
      // Add the common line
      if (oldIdx < oldLines.length && newIdx < newLines.length) {
        result.push({ type: "unchanged", content: oldLines[oldIdx] });
        oldIdx++;
        newIdx++;
        lcsIdx++;
      }
    } else {
      // No more LCS elements, just add remaining lines
      while (oldIdx < oldLines.length) {
        result.push({ type: "removed", content: oldLines[oldIdx] });
        oldIdx++;
      }
      while (newIdx < newLines.length) {
        result.push({ type: "added", content: newLines[newIdx] });
        newIdx++;
      }
    }
  }

  return result;
};

// Compute Longest Common Subsequence
const computeLCS = (arr1: string[], arr2: string[]): string[] => {
  const m = arr1.length;
  const n = arr2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const lcs: string[] = [];
  let i = m,
    j = n;
  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift(arr1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
};

const DiffView: React.FC<{
  title: string;
  oldText: string;
  newText: string;
  showLineNumbers: boolean;
}> = ({ title, oldText, newText, showLineNumbers }) => {
  const diffLines = useMemo(
    () => computeDiff(oldText, newText),
    [oldText, newText]
  );
  const hasChanges = diffLines.some((line) => line.type !== "unchanged");

  // Calculate line numbers for old and new text
  const linesWithNumbers = useMemo(() => {
    let oldLineNum = 0;
    let newLineNum = 0;
    return diffLines.map((line) => {
      let oldNum: number | null = null;
      let newNum: number | null = null;
      if (line.type === "removed") {
        oldLineNum++;
        oldNum = oldLineNum;
      } else if (line.type === "added") {
        newLineNum++;
        newNum = newLineNum;
      } else {
        oldLineNum++;
        newLineNum++;
        oldNum = oldLineNum;
        newNum = newLineNum;
      }
      return { ...line, oldNum, newNum };
    });
  }, [diffLines]);

  if (!hasChanges && !oldText && !newText) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {!hasChanges ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: "italic" }}
        >
          No changes
        </Typography>
      ) : (
        <Box
          sx={{
            fontFamily: "monospace",
            fontSize: "0.875rem",
            border: 1,
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          {linesWithNumbers.map((line, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                px: 1,
                py: 0.5,
                backgroundColor:
                  line.type === "added"
                    ? "success.light"
                    : line.type === "removed"
                    ? "error.light"
                    : "transparent",
                color:
                  line.type === "added"
                    ? "success.contrastText"
                    : line.type === "removed"
                    ? "error.contrastText"
                    : "text.primary",
                borderBottom: index < linesWithNumbers.length - 1 ? 1 : 0,
                borderColor: "divider",
                "&:hover": {
                  backgroundColor:
                    line.type === "added"
                      ? "success.main"
                      : line.type === "removed"
                      ? "error.main"
                      : "action.hover",
                },
              }}
            >
              {showLineNumbers && (
                <>
                  <Box
                    sx={{
                      width: 40,
                      flexShrink: 0,
                      textAlign: "right",
                      pr: 1,

                      borderRight: 1,
                      borderColor: "divider",
                      mr: 1,
                      userSelect: "none",
                    }}
                  >
                    {line.oldNum || ""}
                  </Box>
                  <Box
                    sx={{
                      width: 40,
                      flexShrink: 0,
                      textAlign: "right",
                      pr: 1,

                      borderRight: 1,
                      borderColor: "divider",
                      mr: 1,
                      userSelect: "none",
                    }}
                  >
                    {line.newNum || ""}
                  </Box>
                </>
              )}
              <Box
                sx={{
                  width: 24,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 1,
                }}
              >
                {line.type === "added" && <AddIcon fontSize="small" />}
                {line.type === "removed" && <RemoveIcon fontSize="small" />}
              </Box>
              <Typography
                component="pre"
                sx={{
                  m: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  flex: 1,
                }}
              >
                {line.content || " "}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

const CompareView: React.FC<{
  oldSummary: string;
  newSummary: string;
  oldDescription: string;
  newDescription: string;
  renderMarkdown?: boolean;
}> = ({
  oldSummary,
  newSummary,
  oldDescription,
  newDescription,
  renderMarkdown,
}) => {
  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        gap: 1,
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      <Box
        sx={{
          maxWidth: "50%",
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          Summary:
          <Typography
            variant="body2"
            color="text.secondary"
            component="span"
            sx={{ whiteSpace: "pre-line", ml: 1 }}
          >
            {oldSummary}
          </Typography>
        </Typography>
        <Stack direction="column" spacing={1} sx={{ mt: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Description:
          </Typography>
          {renderMarkdown ? (
            <MarkdownMessage content={oldDescription} />
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ whiteSpace: "pre-line", mt: 1 }}
            >
              {oldDescription}
            </Typography>
          )}
        </Stack>
      </Box>

      <Box
        sx={{
          maxWidth: "50%",
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          Summary:
          <Typography
            variant="body2"
            color="text.secondary"
            component="span"
            sx={{ whiteSpace: "pre-line", ml: 1 }}
          >
            {newSummary}
          </Typography>
        </Typography>
        <Stack direction="column" spacing={1} sx={{ mt: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Description:
          </Typography>
          {renderMarkdown ? (
            <MarkdownMessage content={newDescription} />
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ whiteSpace: "pre-line", mt: 1 }}
            >
              {newDescription}
            </Typography>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export const ProposalContentDiffDialog: React.FC<
  ProposalContentDiffDialogProps
> = ({ open, onClose, content, connectionId, projectKey }) => {
  const [currentStory, setCurrentStory] = useState<StoryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("diff");
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [renderMarkdown, setRenderMarkdown] = useState(false);

  useEffect(() => {
    if (!open || !content || !connectionId || !projectKey) {
      return;
    }

    // For CREATE type, there's no current story to compare
    if (content.type === "CREATE") {
      setCurrentStory(null);
      return;
    }

    // For UPDATE and DELETE, fetch the current story
    if (content.story_key) {
      const fetchStory = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await userService.getStory(
            connectionId,
            projectKey,
            content.story_key!
          );
          if (response.data) {
            setCurrentStory(response.data);
          } else {
            setError("Failed to load current story");
          }
        } catch (err: any) {
          setError(
            err.response?.data?.detail || "Failed to load current story"
          );
        } finally {
          setLoading(false);
        }
      };

      fetchStory();
    }
  }, [open, content, connectionId, projectKey]);

  const handleClose = () => {
    setCurrentStory(null);
    setError(null);
    onClose();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "CREATE":
        return "New Story";
      case "UPDATE":
        return "Update Story";
      case "DELETE":
        return "Delete Story";
      default:
        return "Unknown";
    }
  };

  const getTypeColor = (type: string) => {
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

  const renderContentView = (
    oldSummary: string,
    newSummary: string,
    oldDescription: string,
    newDescription: string
  ) => {
    if (viewMode === "diff") {
      return (
        <>
          <DiffView
            title="Summary"
            oldText={oldSummary}
            newText={newSummary}
            showLineNumbers={showLineNumbers}
          />
          <DiffView
            title="Description"
            oldText={oldDescription}
            newText={newDescription}
            showLineNumbers={showLineNumbers}
          />
        </>
      );
    }
    return (
      <CompareView
        oldSummary={oldSummary}
        newSummary={newSummary}
        oldDescription={oldDescription}
        newDescription={newDescription}
        renderMarkdown={renderMarkdown}
      />
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      sx={{ ...scrollBarSx }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h6">Proposal Changes</Typography>
          {content && (
            <>
              <Chip
                label={getTypeLabel(content.type)}
                color={getTypeColor(content.type) as any}
                size="small"
              />
              {content.story_key && (
                <StoryChip
                  storyKey={content.story_key}
                  size="small"
                  clickable={false}
                />
              )}
            </>
          )}
        </Stack>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : content ? (
          <Box>
            {/* View Options */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", sm: "center" }}
              sx={{ mb: 3 }}
            >
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, value) => value && setViewMode(value)}
                size="small"
              >
                <ToggleButton value="diff">
                  <DifferenceIcon sx={{ mr: 1 }} fontSize="small" />
                  Diff View
                </ToggleButton>
                <ToggleButton value="compare">
                  <CompareArrowsIcon sx={{ mr: 1 }} fontSize="small" />
                  Compare View
                </ToggleButton>
              </ToggleButtonGroup>
              {viewMode === "diff" ? (
                <FormControlLabel
                  control={
                    <Switch
                      checked={showLineNumbers}
                      onChange={(e) => setShowLineNumbers(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Show line numbers"
                />
              ) : (
                <FormControlLabel
                  control={
                    <Switch
                      checked={renderMarkdown}
                      onChange={(e) => setRenderMarkdown(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Render descriptions as Markdown"
                />
              )}
            </Stack>

            {content.type === "CREATE" && (
              <>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  This proposal creates a new story with the following content:
                </Typography>
                {renderContentView(
                  "",
                  content.summary || "",
                  "",
                  content.description || ""
                )}
              </>
            )}
            {content.type === "UPDATE" && (
              <>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Comparing current story with proposed changes:
                </Typography>
                {renderContentView(
                  currentStory?.summary || "",
                  content.summary || "",
                  currentStory?.description || "",
                  content.description || ""
                )}
              </>
            )}
            {content.type === "DELETE" && (
              <>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  This proposal will delete the following story:
                </Typography>
                {renderContentView(
                  currentStory?.summary || "",
                  "",
                  currentStory?.description || "",
                  ""
                )}
              </>
            )}
            {content.explanation && (
              <Box
                sx={{ mt: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}
              >
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Explanation
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                  {content.explanation}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Typography color="text.secondary">No content selected</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProposalContentDiffDialog;
