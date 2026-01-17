"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Paper, Typography, CircularProgress } from "@mui/material";
import GherkinEditorWrapper from "@/components/ac/GherkinEditorWrapper";
import { ACDto, AISuggestion } from "@/types/ac";
import { useACQuery } from "@/hooks/queries/useACQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { connectionService } from "@/services/connectionService";
import { acService } from "@/services/acService";
import { lintGherkin } from "@/utils/gherkin-linter";

export default function GherkinEditorInternalPage() {
  const params = useParams();
  const id = params?.id as string;

  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [annotations, setAnnotations] = useState<any[]>([]);

  const { selectedConnectionId, selectedProjectKey, selectedStoryKey } =
    useWorkspaceStore();

  const { data, isLoading, refetch } = useACQuery(
    selectedConnectionId || undefined,
    selectedProjectKey || undefined,
    selectedStoryKey || undefined,
    id
  );

  const currentAC = data?.data || null;

  const [editorReadOnly, setEditorReadOnly] = useState(false);

  const fetchSuggestions = useCallback(
    async (content: string, line: number, col: number) => {
      if (!currentAC) return;
      try {
        const res = await acService.getSuggestions(
          currentAC.story_key,
          content,
          line,
          col
        );
        setSuggestions(res.suggestions);
      } catch (error) {
        console.error(error);
      }
    },
    []
  ); // Dependencies? Likely none if acService is static, otherwise add them

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  // 2. Wrap lintContent in useCallback
  const lintContent = useCallback((content: string) => {
    return;
    const errors = lintGherkin(content);
    const newAnnotations = errors.map((err: any) => ({
      row: err.line - 1,
      column: err.column || 0,
      text: err.message,
      type: "error",
    }));

    // Optional optimization: Compare lengths or content to avoid unnecessary re-renders
    setAnnotations(newAnnotations);
  }, []);

  const handleSave = async (val: string) => {
    if (
      selectedConnectionId &&
      selectedProjectKey &&
      selectedStoryKey &&
      currentAC
    ) {
      await connectionService.updateAC(
        selectedConnectionId,
        selectedProjectKey,
        selectedStoryKey,
        currentAC.id,
        val
      );
      refetch();
    }
  };

  const handleSendFeedback = async (gherkin: string, feedback: string) => {
    if (
      selectedConnectionId &&
      selectedProjectKey &&
      selectedStoryKey &&
      currentAC
    ) {
      try {
        setEditorReadOnly(true);
        await connectionService.regenerateAC(
          selectedConnectionId,
          selectedProjectKey,
          selectedStoryKey,
          currentAC.id,
          gherkin,
          feedback
        );
        refetch();
      } catch (error) {
        throw error;
      } finally {
        setEditorReadOnly(false);
      }
    }
  };

  if (isLoading && !currentAC) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!currentAC && !isLoading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>AC Not Found</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{ height: "100%", p: 2, display: "flex", flexDirection: "column" }}
    >
      <Typography variant="h6" gutterBottom>
        {currentAC?.summary || "Untitled AC"}
      </Typography>
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <GherkinEditorWrapper
          storyKey={currentAC!.story_key}
          initialValue={currentAC?.description || ""}
          onSave={handleSave}
          onSendFeedback={handleSendFeedback}
          readOnly={editorReadOnly}
          // suggestions={suggestions}
          // clearSuggestions={clearSuggestions}
          // fetchSuggestions={fetchSuggestions}
          // annotations={annotations}
          // lintContent={lintContent}
        />
      </Box>
    </Box>
  );
}
