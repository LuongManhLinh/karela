import { useState } from "react";
import {
  Box,
  Stack,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Paper,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ReactMarkdown from "react-markdown";
import type { ExtraDoc, ProjectSettings } from "../types";

type Props = {
  value: ProjectSettings;
  onChange: (value: ProjectSettings) => void;
};

export function SettingsForm({ value, onChange }: Props) {
  const handleField = (key: keyof ProjectSettings) => (e: any) => {
    onChange({ ...value, [key]: e.target.value });
  };

  const handleToggle = (_: any, next: "on" | "off" | null) => {
    if (!next) return;
    onChange({ ...value, enableLLM: next === "on" });
  };

  const handleCoverage = (e: any) => {
    const num = Number(e.target.value ?? 0);
    onChange({ ...value, coverageThreshold: isNaN(num) ? 0 : num });
  };

  const docs = value.extraDocs ?? [];
  const setDocs = (next: ExtraDoc[]) => onChange({ ...value, extraDocs: next });

  const addDoc = () => {
    const id = Math.random().toString(36).slice(2);
    setDocs([...(docs ?? []), { id, title: "Untitled", content: "" }]);
  };

  const updateDoc = (id: string, patch: Partial<ExtraDoc>) => {
    setDocs(docs.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const removeDoc = (id: string) => {
    setDocs(docs.filter((d) => d.id !== id));
  };

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1">General</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ minWidth: 140 }}>
              LLM features
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={value.enableLLM ? "on" : "off"}
              onChange={handleToggle}
              size="small"
            >
              <ToggleButton value="on">On</ToggleButton>
              <ToggleButton value="off">Off</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <TextField
            type="number"
            label="Coverage threshold (%)"
            value={value.coverageThreshold ?? 70}
            onChange={handleCoverage}
            inputProps={{ min: 0, max: 100 }}
          />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1">Core documents</Typography>
          <TextField
            label="Product Vision"
            value={value.productVision ?? ""}
            onChange={handleField("productVision")}
            minRows={4}
            multiline
            helperText="Markdown supported"
          />
          <TextField
            label="Product Scope"
            value={value.productScope ?? ""}
            onChange={handleField("productScope")}
            minRows={4}
            multiline
            helperText="Markdown supported"
          />
          <TextField
            label="Sprint Goals"
            value={value.sprintGoals ?? ""}
            onChange={handleField("sprintGoals")}
            minRows={3}
            multiline
            helperText="Markdown supported"
          />
          <TextField
            label="Glossary"
            value={value.glossary ?? ""}
            onChange={handleField("glossary")}
            minRows={3}
            multiline
            helperText="Markdown supported"
          />
          <TextField
            label="Constraints"
            value={value.constraints ?? ""}
            onChange={handleField("constraints")}
            minRows={3}
            multiline
            helperText="Markdown supported"
          />
          <TextField
            label="LLM Guidelines"
            value={value.llmGuidelines ?? ""}
            onChange={handleField("llmGuidelines")}
            minRows={4}
            multiline
            helperText="Markdown supported"
          />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="subtitle1">Additional documents</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addDoc}
              variant="outlined"
              size="small"
            >
              Add document
            </Button>
          </Stack>
          <Stack spacing={2}>
            {docs.map((doc) => (
              <Paper key={doc.id} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      label="Title"
                      value={doc.title}
                      onChange={(e) =>
                        updateDoc(doc.id, { title: e.target.value })
                      }
                      fullWidth
                    />
                    <IconButton
                      aria-label="remove"
                      onClick={() => removeDoc(doc.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                  <TextField
                    label="Content (Markdown)"
                    value={doc.content}
                    onChange={(e) =>
                      updateDoc(doc.id, { content: e.target.value })
                    }
                    minRows={3}
                    fullWidth
                    multiline
                  />
                  {doc.content?.trim() ? (
                    <Box
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        p: 1,
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Preview
                      </Typography>
                      <ReactMarkdown>{doc.content}</ReactMarkdown>
                    </Box>
                  ) : null}
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
