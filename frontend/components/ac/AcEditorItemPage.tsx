"use client";

import { Box, Typography, CircularProgress } from "@mui/material";
import GherkinEditorWrapper from "@/components/ac/GherkinEditorWrapper";
import { useACQuery } from "@/hooks/queries/useACQueries";
import { connectionService } from "@/services/connectionService";
import { useMemo, useState } from "react";
import { acService } from "@/services/acService";

export interface AcEditorItemPageProps {
  connectionName: string;
  projectKey: string;
  storyKey?: string; // Required if level is "story"
  idOrKey: string;
}

const AcEditorItemPage: React.FC<AcEditorItemPageProps> = ({
  connectionName,
  projectKey,
  storyKey,
  idOrKey,
}) => {
  const { data, isLoading, refetch } = useACQuery(
    connectionName,
    projectKey,
    storyKey,
    idOrKey,
  );

  const currentAC = useMemo(() => data?.data || null, [data]);

  const [editorReadOnly, setEditorReadOnly] = useState(false);

  const handleSave = async (val: string) => {
    if (connectionName && projectKey && storyKey && currentAC) {
      await acService.updateAC(currentAC.id, val);
      refetch();
    }
  };

  const handleSendFeedback = async (gherkin: string, feedback: string) => {
    if (connectionName && projectKey && storyKey && currentAC) {
      try {
        setEditorReadOnly(true);
        await acService.regenerateAC(currentAC.id, gherkin, feedback);
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
};

export default AcEditorItemPage;
