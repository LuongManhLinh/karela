"use client";

import React, { useState, useEffect } from "react";
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
} from "@/hooks/queries/usePreferenceQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type {
  CreatePreferenceRequest,
  UpdatePreferenceRequest,
} from "@/types/preference";
import type { ProjectDto } from "@/types/connection";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { SessionStartForm } from "@/components/SessionStartForm";
import { useNotificationContext } from "@/providers/NotificationProvider";
import { useTranslations } from "next-intl";

const MIN_TEXTFIELD_ROWS = 3;
const MAX_TEXTFIELD_ROWS = 20;

const PROPOSAL_MODES = [
  { value: "SIMPLE", labelKey: "proposalModes.simple" },
  { value: "COMPLEX", labelKey: "proposalModes.complex" },
  { value: "DEEP", labelKey: "proposalModes.deep" },
];

const GEN_LANGUAGES = [
  { value: "STORY_BASED", labelKey: "generationLanguages.storyBased" },
  { value: "ENGLISH", labelKey: "generationLanguages.english" },
  { value: "VIETNAMESE", labelKey: "generationLanguages.vietnamese" },
];

export default function PreferencesPage() {
  const { connection, selectedProject, setSelectedProject, projects } =
    useWorkspaceStore();

  const projectKey = selectedProject?.key;

  const t = useTranslations("PreferencesPage");

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
  const [genAcGuidelines, setGenAcGuidelines] = useState("");

  useEffect(() => {
    if (preference) {
      setRunAnalysisGuidelines(preference.run_analysis_guidelines || "");
      setGenProposalGuidelines(preference.gen_proposal_guidelines || "");
      setGenProposalAfterAnalysis(
        preference.gen_proposal_after_analysis || false,
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
      notify(t("selectConnectionAndProjectWarning"), { severity: "warning" });
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
        notify(t("preferencesUpdatedSuccess"), { severity: "success" });
      } else {
        await createPreference({ projectKey, data });
        notify(t("preferencesCreatedSuccess"), { severity: "success" });
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || t("savePreferencesFailed");
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
          <Typography variant="h5">{t("title")}</Typography>
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
            {t("connectionAndProjects")}
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
              {t("projectPreferences")}
            </Typography>
            {preference && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 2, display: "block" }}
              >
                {t("lastUpdated", {
                  date: new Date(preference.updated_at).toLocaleString(),
                })}
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
                    label={t("analysisGuidelines")}
                    value={runAnalysisGuidelines}
                    onChange={(e) => setRunAnalysisGuidelines(e.target.value)}
                    disabled={isCreating || isUpdating}
                    placeholder={t("analysisGuidelinesPlaceholder")}
                    minRows={MIN_TEXTFIELD_ROWS}
                    maxRows={MAX_TEXTFIELD_ROWS}
                    sx={{ ...scrollBarSx }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    label={t("proposalGenerationGuidelines")}
                    value={genProposalGuidelines}
                    onChange={(e) => setGenProposalGuidelines(e.target.value)}
                    disabled={isCreating || isUpdating}
                    placeholder={t("proposalGenerationGuidelinesPlaceholder")}
                    minRows={MIN_TEXTFIELD_ROWS}
                    maxRows={MAX_TEXTFIELD_ROWS}
                    sx={{ ...scrollBarSx }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    label={t("chatGuidelines")}
                    value={chatGuidelines}
                    onChange={(e) => setChatGuidelines(e.target.value)}
                    disabled={isCreating || isUpdating}
                    placeholder={t("chatGuidelinesPlaceholder")}
                    minRows={MIN_TEXTFIELD_ROWS}
                    maxRows={MAX_TEXTFIELD_ROWS}
                    sx={{ ...scrollBarSx }}
                  />

                  <TextField
                    fullWidth
                    multiline
                    label={t("genAcGuidelines")}
                    value={genAcGuidelines}
                    onChange={(e) => setGenAcGuidelines(e.target.value)}
                    disabled={isCreating || isUpdating}
                    placeholder={t("genAcGuidelinesPlaceholder")}
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
                    label={t("autoGenerateProposalsAfterAnalysis")}
                  />

                  <FormControl fullWidth>
                    <InputLabel>{t("proposalGenerationMode")}</InputLabel>
                    <Select
                      value={genProposalMode}
                      label={t("proposalGenerationMode")}
                      onChange={(e) => setGenProposalMode(e.target.value)}
                      disabled={isCreating || isUpdating}
                    >
                      {PROPOSAL_MODES.map((mode) => (
                        <MenuItem key={mode.value} value={mode.value}>
                          {t(mode.labelKey)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>{t("generationLanguage")}</InputLabel>
                    <Select
                      value={genLanguage}
                      label={t("generationLanguage")}
                      onChange={(e) => setGenLanguage(e.target.value)}
                      disabled={isCreating || isUpdating}
                    >
                      {GEN_LANGUAGES.map((lang) => (
                        <MenuItem key={lang.value} value={lang.value}>
                          {t(lang.labelKey)}
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
                        <span>{t("saving")}</span>
                      </Box>
                    ) : preference ? (
                      t("updatePreferences")
                    ) : (
                      t("createPreferences")
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
