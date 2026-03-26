"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Stack,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Layout } from "@/components/Layout";

import {
  usePreferenceQuery,
  useCreatePreferenceMutation,
  useUpdatePreferenceMutation,
} from "@/hooks/queries/useSettingsQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type {
  CreatePreferenceRequest,
  UpdatePreferenceRequest,
} from "@/types/settings";
import type { ProjectDto } from "@/types/connection";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { SessionStartForm } from "@/components/SessionStartForm";
import { useNotificationContext } from "@/providers/NotificationProvider";

const MIN_TEXTFIELD_ROWS = 3;
const MAX_TEXTFIELD_ROWS = 20;

const PROPOSAL_MODES = [
  { value: "SIMPLE", label: "Simple" },
  { value: "COMPLEX", label: "Complex" },
];

const GEN_LANGUAGES = [
  { value: "STORY_BASED", label: "Story Based" },
  { value: "ENGLISH", label: "English" },
  { value: "VIETNAMESE", label: "Vietnamese" },
];

export default function PreferencesPage() {
  const { connection, selectedProject, setSelectedProject, projects } =
    useWorkspaceStore();

  const projectKey = selectedProject?.key;

  const { data: preferenceData, isLoading: isPreferenceLoading } =
    usePreferenceQuery(projectKey);

  const { mutateAsync: createPreference, isPending: isCreating } =
    useCreatePreferenceMutation();
  const { mutateAsync: updatePreference, isPending: isUpdating } =
    useUpdatePreferenceMutation();

  const preference = preferenceData?.data;
  const { notify } = useNotificationContext();

  // Form fields
  const [runAnalysisGuidelines, setRunAnalysisGuidelines] = useState("");
  const [genProposalGuidelines, setGenProposalGuidelines] = useState("");
  const [genProposalAfterAnalysis, setGenProposalAfterAnalysis] =
    useState(false);
  const [genProposalMode, setGenProposalMode] = useState("SIMPLE");
  const [genLanguage, setGenLanguage] = useState("STORY_BASED");
  const [chatGuidelines, setChatGuidelines] = useState("");

  useEffect(() => {
    if (preference) {
      setRunAnalysisGuidelines(preference.run_analysis_guidelines || "");
      setGenProposalGuidelines(preference.gen_proposal_guidelines || "");
      setGenProposalAfterAnalysis(
        preference.gen_proposal_after_analysis || false
      );
      setGenProposalMode(preference.gen_proposal_mode || "SIMPLE");
      setGenLanguage(preference.gen_language || "STORY_BASED");
      setChatGuidelines(preference.chat_guidelines || "");
    } else {
      resetForm();
    }
  }, [preference]);

  const resetForm = () => {
    setRunAnalysisGuidelines("");
    setGenProposalGuidelines("");
    setGenProposalAfterAnalysis(false);
    setGenProposalMode("SIMPLE");
    setGenLanguage("STORY_BASED");
    setChatGuidelines("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connection || !projectKey) {
      notify("Please select a connection and project", { severity: "warning" });
      return;
    }

    const isSaving = isCreating || isUpdating;
    if (isSaving) return;

    try {
      const data: CreatePreferenceRequest | UpdatePreferenceRequest = {
        run_analysis_guidelines: runAnalysisGuidelines || undefined,
        gen_proposal_guidelines: genProposalGuidelines || undefined,
        gen_proposal_after_analysis: genProposalAfterAnalysis,
        gen_proposal_mode: genProposalMode,
        gen_language: genLanguage,
        chat_guidelines: chatGuidelines || undefined,
      };

      if (preference) {
        await updatePreference({ projectKey, data });
        notify("Preferences updated successfully", { severity: "success" });
      } else {
        await createPreference({ projectKey, data });
        notify("Preferences created successfully", { severity: "success" });
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to save preferences";
      notify(errorMessage, { severity: "error" });
    }
  };

  const handleProjectKeyChange = (project: ProjectDto | null) => {
    setSelectedProject(project || null);
    resetForm();
  };

  return (
    <Layout
      appBarLeftContent={
        <Stack direction={"row"} alignItems="center" spacing={2} py={2}>
          <Typography variant="h5">Preferences</Typography>
        </Stack>
      }
      appBarTransparent
      basePath="/app"
    >
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, overflowY: "auto" }}>
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 1,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Connection &amp; Projects
          </Typography>
          <SessionStartForm
            projectOptions={{
              options: projects,
              selectedOption: selectedProject,
              onChange: handleProjectKeyChange,
            }}
          />
        </Paper>

        {connection && selectedProject && (
          <Paper
            elevation={2}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 1,
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Project Preferences
            </Typography>
            {preference && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 2, display: "block" }}
              >
                Last updated:{" "}
                {new Date(preference.updated_at).toLocaleString()}
              </Typography>
            )}
            {isPreferenceLoading ? (
              <LoadingSpinner />
            ) : (
              <Box component="form" onSubmit={handleSave}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    multiline
                    label="Analysis Guidelines"
                    value={runAnalysisGuidelines}
                    onChange={(e) => setRunAnalysisGuidelines(e.target.value)}
                    disabled={isCreating || isUpdating}
                    placeholder="Provide specific guidelines for how the LLM should analyze stories in this project..."
                    minRows={MIN_TEXTFIELD_ROWS}
                    maxRows={MAX_TEXTFIELD_ROWS}
                    sx={{ ...scrollBarSx }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    label="Proposal Generation Guidelines"
                    value={genProposalGuidelines}
                    onChange={(e) => setGenProposalGuidelines(e.target.value)}
                    disabled={isCreating || isUpdating}
                    placeholder="Provide specific guidelines for how the LLM should generate proposals..."
                    minRows={MIN_TEXTFIELD_ROWS}
                    maxRows={MAX_TEXTFIELD_ROWS}
                    sx={{ ...scrollBarSx }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    label="Chat Guidelines"
                    value={chatGuidelines}
                    onChange={(e) => setChatGuidelines(e.target.value)}
                    disabled={isCreating || isUpdating}
                    placeholder="Provide specific guidelines for how the LLM should behave in chat..."
                    minRows={MIN_TEXTFIELD_ROWS}
                    maxRows={MAX_TEXTFIELD_ROWS}
                    sx={{ ...scrollBarSx }}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={genProposalAfterAnalysis}
                        onChange={(e) =>
                          setGenProposalAfterAnalysis(e.target.checked)
                        }
                        disabled={isCreating || isUpdating}
                      />
                    }
                    label="Automatically generate proposals after analysis"
                  />

                  <FormControl fullWidth>
                    <InputLabel>Proposal Generation Mode</InputLabel>
                    <Select
                      value={genProposalMode}
                      label="Proposal Generation Mode"
                      onChange={(e) => setGenProposalMode(e.target.value)}
                      disabled={isCreating || isUpdating}
                    >
                      {PROPOSAL_MODES.map((mode) => (
                        <MenuItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Generation Language</InputLabel>
                    <Select
                      value={genLanguage}
                      label="Generation Language"
                      onChange={(e) => setGenLanguage(e.target.value)}
                      disabled={isCreating || isUpdating}
                    >
                      {GEN_LANGUAGES.map((lang) => (
                        <MenuItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isCreating || isUpdating}
                    fullWidth
                  >
                    {isCreating || isUpdating ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CircularProgress size={20} />
                        <span>Saving...</span>
                      </Box>
                    ) : preference ? (
                      "Update Preferences"
                    ) : (
                      "Create Preferences"
                    )}
                  </Button>
                </Stack>
              </Box>
            )}
          </Paper>
        )}
      </Container>
    </Layout>
  );
}
