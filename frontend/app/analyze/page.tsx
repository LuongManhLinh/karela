"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
} from "@mui/material";
import { Layout } from "@/components/Layout";
import { SessionStartForm } from "@/components/SessionStartForm";
import { defectService } from "@/services/defectService";
import { ErrorSnackbar } from "@/components/ErrorSnackbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import type { AnalysisSummary, AnalysisDetailDto, DefectDto } from "@/types";

export default function AnalyzePage() {
  const router = useRouter();
  const [connectionId, setConnectionId] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [summaries, setSummaries] = useState<AnalysisSummary[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleStartAnalysis = async (data: {
    connectionId: string;
    projectKey: string;
    storyKey?: string;
  }) => {
    setConnectionId(data.connectionId);
    setProjectKey(data.projectKey);
    setLoading(true);
    setError("");

    try {
      const response = await defectService.runAnalysis(
        data.connectionId,
        data.projectKey,
        {
          analysis_type: data.storyKey ? "TARGETED" : "ALL",
          target_story_key: data.storyKey,
        }
      );

      if (response.data) {
        // Reload summaries after starting analysis
        await loadSummaries(data.connectionId, data.projectKey);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to start analysis";
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadSummaries = async (connId: string, projKey: string) => {
    try {
      const response = await defectService.getAnalysisSummaries(connId, projKey);
      if (response.data) {
        setSummaries(response.data);
      }
    } catch (err: any) {
      console.error("Failed to load summaries:", err);
    }
  };

  const handleSelectAnalysis = async (analysisId: string) => {
    setLoadingDetails(true);
    try {
      const response = await defectService.getAnalysisDetails(analysisId);
      if (response.data) {
        setSelectedAnalysis(response.data);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to load analysis details";
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleMarkSolved = async (defectId: string, solved: boolean) => {
    try {
      await defectService.markDefectAsSolved(defectId, solved ? 1 : 0);
      // Reload the selected analysis
      if (selectedAnalysis) {
        await handleSelectAnalysis(selectedAnalysis.id);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to update defect status";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "IN_PROGRESS":
        return "info";
      case "FAILED":
        return "error";
      case "PENDING":
        return "warning";
      default:
        return "default";
    }
  };

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

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Analyze Defect
        </Typography>

        <SessionStartForm
          onSubmit={handleStartAnalysis}
          loading={loading}
          submitLabel="Start Analysis"
        />

        {connectionId && projectKey && (
          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            {/* Left Panel - Analysis List */}
            <Paper
              elevation={2}
              sx={{
                width: "30%",
                height: "calc(100vh - 200px)",
                overflow: "auto",
                borderRadius: 3,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                bgcolor: "background.paper",
              }}
            >
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Analysis Sessions
                </Typography>
                <List>
                  {summaries.length === 0 ? (
                    <ListItem>
                      <ListItemText primary="No analysis sessions found" />
                    </ListItem>
                  ) : (
                    summaries.map((summary) => (
                      <ListItem key={summary.id} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                          onClick={() => handleSelectAnalysis(summary.id)}
                          selected={selectedAnalysis?.id === summary.id}
                          sx={{
                            borderRadius: 2,
                            "&.Mui-selected": {
                              bgcolor: "primary.main",
                              color: "white",
                              "&:hover": {
                                bgcolor: "primary.dark",
                              },
                            },
                            "&:hover": {
                              bgcolor: "action.hover",
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <Typography variant="body2">
                                  {summary.type || "Unknown"}
                                </Typography>
                                <Chip
                                  label={summary.status || "Unknown"}
                                  size="small"
                                  color={getStatusColor(summary.status)}
                                />
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {summary.started_at
                                  ? new Date(summary.started_at).toLocaleString()
                                  : "No date"}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))
                  )}
                </List>
              </Box>
            </Paper>

            {/* Right Panel - Analysis Details */}
            <Paper
              elevation={2}
              sx={{
                width: "70%",
                height: "calc(100vh - 200px)",
                overflow: "auto",
                p: 3,
                borderRadius: 3,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                bgcolor: "background.paper",
              }}
            >
              {loadingDetails ? (
                <LoadingSpinner />
              ) : selectedAnalysis ? (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Analysis Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {selectedAnalysis.defects.length === 0 ? (
                    <Typography>No defects found in this analysis.</Typography>
                  ) : (
                    <Grid container spacing={2}>
                      {selectedAnalysis.defects.map((defect) => (
                        <Grid item xs={12} key={defect.id}>
                          <Card
                            elevation={1}
                            sx={{
                              borderRadius: 3,
                              transition: "all 0.2s",
                              "&:hover": {
                                elevation: 3,
                                transform: "translateY(-2px)",
                              },
                            }}
                          >
                            <CardContent sx={{ p: 2.5 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "start",
                                  mb: 1,
                                }}
                              >
                                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                  {defect.type && (
                                    <Chip label={defect.type} size="small" />
                                  )}
                                  {defect.severity && (
                                    <Chip
                                      label={defect.severity}
                                      size="small"
                                      color={getSeverityColor(defect.severity)}
                                    />
                                  )}
                                  {defect.confidence !== undefined && (
                                    <Chip
                                      label={`Confidence: ${(defect.confidence * 100).toFixed(0)}%`}
                                      size="small"
                                    />
                                  )}
                                </Box>
                                <Button
                                  size="small"
                                  variant={defect.solved ? "outlined" : "contained"}
                                  color={defect.solved ? "success" : "primary"}
                                  onClick={() =>
                                    handleMarkSolved(defect.id, !defect.solved)
                                  }
                                >
                                  {defect.solved ? "Mark Unsolved" : "Mark Solved"}
                                </Button>
                              </Box>
                              {defect.explanation && (
                                <Typography variant="body2" paragraph>
                                  <strong>Explanation:</strong> {defect.explanation}
                                </Typography>
                              )}
                              {defect.suggested_fix && (
                                <Typography variant="body2" paragraph>
                                  <strong>Suggested Fix:</strong> {defect.suggested_fix}
                                </Typography>
                              )}
                              {defect.work_item_keys && defect.work_item_keys.length > 0 && (
                                <Typography variant="body2">
                                  <strong>Work Items:</strong>{" "}
                                  {defect.work_item_keys.join(", ")}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  Select an analysis session to view details
                </Typography>
              )}
            </Paper>
          </Box>
        )}

        {connectionId && projectKey && summaries.length === 0 && !loading && (
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography color="text.secondary">
              No analysis sessions found. Start a new analysis above.
            </Typography>
          </Box>
        )}
      </Container>
      <ErrorSnackbar
        open={showError}
        message={error}
        onClose={() => setShowError(false)}
      />
    </Layout>
  );
}

