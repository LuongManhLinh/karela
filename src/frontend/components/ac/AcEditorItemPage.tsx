"use client";

import { Box, Typography, CircularProgress } from "@mui/material";
import GherkinEditorWrapper from "@/components/ac/GherkinEditorWrapper";
import { useACQuery, useStoryByACQuery } from "@/hooks/queries/useACQueries";
import { useMemo, useState } from "react";
import { acService } from "@/services/acService";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { StoryDialog } from "../StoryDialog";
import StoryChip from "../StoryChip";
import { useTranslations } from "next-intl";

export interface AcEditorItemPageProps {
  connectionName: string;
  idOrKey: string;
}

const AcEditorItemPage: React.FC<AcEditorItemPageProps> = ({
  connectionName,
  idOrKey,
}) => {
  const { data, isLoading, refetch } = useACQuery(
    connectionName,
    idOrKey,
  );
  const currentAC = useMemo(() => data?.data || null, [data]);

  const t = useTranslations("ac.AcEditorItemPage");

  const {
    data: storyData,
    isLoading: loading,
    error,
  } = useStoryByACQuery(currentAC?.id);

  const story = useMemo(() => {
    return storyData?.data || null;
  }, [storyData]);

  const initialGherkin = useMemo(() => {
    const gherkin = currentAC?.description || "";
    // Remove ````gherkin` and ``` markers if present and trim whitespace
    return gherkin
      .replace(/^```gherkin\s*/, "")
      .replace(/```$/, "")
      .trim();
  }, [currentAC]);

  const [editorReadOnly, setEditorReadOnly] = useState(false);
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);

  const handleSave = async (val: string) => {
    if (currentAC) {
      // Add ```gherkin markers around the content
      const gherkinContent = "```gherkin\n" + val + "\n```";
      await acService.updateAC(currentAC.id, gherkinContent);
      await refetch();
    }
  };

  const handleSendFeedback = async (gherkin: string, feedback: string) => {
    if (currentAC) {
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
        <Typography>{t("acNotFound")}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        gap: 2,
        px: 2,
        pb: 1,
        flexDirection: "column",
        ...scrollBarSx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography variant="h6">
          {t("acceptanceCriteria")} {currentAC?.key || currentAC!.id}
        </Typography>
        {story && (
          <StoryChip
            storyKey={`Story-${story.key}`}
            onClick={() => setStoryDialogOpen(true)}
          />
        )}
      </Box>
      <Typography variant="subtitle1">{currentAC!.summary}</Typography>
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <GherkinEditorWrapper
          acId={currentAC!.id}
          initialValue={initialGherkin}
          onSave={handleSave}
          onSendFeedback={handleSendFeedback}
          readOnly={editorReadOnly}
        />
      </Box>
      <StoryDialog
        open={storyDialogOpen}
        onClose={() => setStoryDialogOpen(false)}
        story={story}
        loading={loading}
        error={error}
      />
    </Box>
  );
};

export default AcEditorItemPage;
