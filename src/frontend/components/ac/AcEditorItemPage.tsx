"use client";

import { Box, Typography, CircularProgress } from "@mui/material";
import GherkinEditorWrapper from "@/components/ac/GherkinEditorWrapper";
import {
  useACQuery,
  useACRegenerateMutation,
  useStoryByACQuery,
} from "@/hooks/queries/useACQueries";
import { useEffect, useMemo, useState } from "react";
import { acService } from "@/services/acService";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { StoryDialog } from "../StoryDialog";
import StoryChip from "../StoryChip";
import { useTranslations } from "next-intl";

export interface AcEditorItemPageProps {
  idOrKey: string;
}

const AcEditorItemPage: React.FC<AcEditorItemPageProps> = ({ idOrKey }) => {
  const { data, isLoading, refetch } = useACQuery(idOrKey);
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

  // const gherkin = useMemo(() => {
  //   const gherkin = currentAC?.description || "";
  //   // Remove ````gherkin` and ``` markers if present and trim whitespace
  //   return gherkin.replace(/^```gherkin\s*/, "").replace(/```$/, "");
  // }, [currentAC]);

  const [gherkin, setGherkin] = useState("");

  useEffect(() => {
    if (currentAC) {
      const gherkinContent = currentAC.description || "";
      const cleanedGherkin = gherkinContent
        .replace(/^```gherkin\s*/, "")
        .replace(/```$/, "");
      setGherkin(cleanedGherkin);
    }
  }, [currentAC]);

  const [editorReadOnly, setEditorReadOnly] = useState(false);
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleSave = async (val: string) => {
    if (currentAC) {
      // Add ```gherkin markers around the content
      const gherkinContent = "```gherkin" + val + "```";
      await acService.updateAC(currentAC.id, gherkinContent);
      await refetch();
    }
  };

  const handleSendFeedback = async (gherkin: string, feedback: string) => {
    if (currentAC) {
      try {
        setEditorReadOnly(true);
        setRegenerating(true);
        const resp = await acService.regenerateAC(
          currentAC.id,
          gherkin,
          feedback,
        );
        let newGherkin = resp.data;
        if (newGherkin) {
          // Remove ```gherkin markers if present and trim whitespace
          newGherkin = newGherkin
            .replace(/^```gherkin\s*/, "")
            .replace(/```$/, "");
          setGherkin(newGherkin);
          await refetch();
        }
      } catch (error) {
        throw error;
      } finally {
        setEditorReadOnly(false);
        setRegenerating(false);
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
          initialValue={gherkin}
          onSave={handleSave}
          onSendFeedback={handleSendFeedback}
          readOnly={editorReadOnly}
          regenerating={regenerating}
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
