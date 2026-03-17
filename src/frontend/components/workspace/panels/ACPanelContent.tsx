"use client";

import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Alert,
  Link as MuiLink,
  CircularProgress,
} from "@mui/material";
import { Save, Edit, Cancel } from "@mui/icons-material";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ACSummary, ACDto } from "@/types/ac";

interface ACCardProps {
  ac: ACSummary;
  content?: string;
  onSave?: (acId: string, newContent: string) => Promise<void>;
}

const ACCard: React.FC<ACCardProps> = ({
  ac,
  content,
  onSave,
}) => {
  const t = useTranslations("workspace.WorkspacePage");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle",
  );

  const handleStartEdit = () => {
    setEditedContent(content || "");
    setIsEditing(true);
    setSaveStatus("idle");
  };

  const handleCancelEdit = () => {
    setEditedContent(content || "");
    setIsEditing(false);
    setSaveStatus("idle");
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      await onSave(ac.id, editedContent);
      setSaveStatus("saved");
      setIsEditing(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Clean up gherkin content for display
  const displayContent = (content || "")
    .replace(/^```gherkin\s*/, "")
    .replace(/```$/, "")
    .trim();

  return (
    <Card variant="outlined" sx={{ bgcolor: "background.paper" }}>
      <CardContent>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={ac.key || ac.id.slice(0, 8)}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Typography variant="subtitle2" color="text.secondary">
              {ac.story_key}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {saveStatus === "saved" && (
              <Chip label={t("saved")} color="success" size="small" />
            )}
            {saveStatus === "error" && (
              <Chip label={t("saveFailed")} color="error" size="small" />
            )}
            {!isEditing ? (
              <Button
                size="small"
                startIcon={<Edit />}
                onClick={handleStartEdit}
                variant="outlined"
              >
                {t("save").replace("Save", "Edit")}
              </Button>
            ) : (
              <>
                <Button
                  size="small"
                  startIcon={<Cancel />}
                  onClick={handleCancelEdit}
                  variant="outlined"
                  color="inherit"
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  startIcon={
                    isSaving ? <CircularProgress size={16} /> : <Save />
                  }
                  onClick={handleSave}
                  variant="contained"
                  disabled={isSaving}
                >
                  {isSaving ? t("saving") : t("save")}
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* Summary */}
        <Typography variant="body2" sx={{ mb: 2 }}>
          {ac.summary}
        </Typography>

        {/* Content - Editable or Read-only */}
        {isEditing ? (
          <TextField
            multiline
            fullWidth
            minRows={6}
            maxRows={20}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            variant="outlined"
            sx={{
              fontFamily: "monospace",
              "& .MuiInputBase-input": {
                fontFamily: "monospace",
                fontSize: "0.875rem",
              },
            }}
          />
        ) : (
          <Box
            sx={{
              bgcolor: "grey.900",
              color: "grey.100",
              p: 2,
              borderRadius: 1,
              fontFamily: "monospace",
              fontSize: "0.875rem",
              whiteSpace: "pre-wrap",
              overflow: "auto",
              maxHeight: 300,
            }}
          >
            {displayContent || "No content"}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

interface ACPanelContentProps {
  acs: ACSummary[];
  acDetails: Record<string, ACDto>;
  loading?: boolean;
  onSaveAC?: (acId: string, newContent: string) => Promise<void>;
  projectKey: string;
}

export const ACPanelContent: React.FC<ACPanelContentProps> = ({
  acs,
  acDetails,
  loading,
  onSaveAC,
  projectKey,
}) => {
  const t = useTranslations("workspace.WorkspacePage");

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (acs.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center">
        {t("noACs")}
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {/* Hint to visit AC editor */}
      <Alert severity="info" sx={{ mb: 1 }}>
        {t("acEditorHint")}{" "}
        <MuiLink
          component={Link}
          href={`/app/projects/${projectKey}/acs`}
          underline="hover"
        >
          {t("acEditorLink")}
        </MuiLink>
        .
      </Alert>

      {/* AC Cards */}
      {acs.map((ac) => (
        <ACCard
          key={ac.id}
          ac={ac}
          content={acDetails[ac.id]?.description}
          onSave={onSaveAC}
        />
      ))}
    </Stack>
  );
};

export default ACPanelContent;
