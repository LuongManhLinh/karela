"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ProjectDto, StorySummary } from "@/types/connection";
import {
  useACsByConnectionQuery,
  useACsByProjectQuery,
  useACsByStoryQuery,
} from "@/hooks/queries/useACQueries";
import PageLayout from "../PageLayout";
import { acService } from "@/services/acService";
import { useTranslations } from "next-intl";
import { PageLevel } from "@/types";
import {
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  Skeleton,
  Typography,
} from "@mui/material";
import { scrollBarSx } from "@/constants/scrollBarSx";

interface AcEditorLayoutProps {
  children?: React.ReactNode;
  level: PageLevel;
  projectKey?: string; // Required if level is "project" or "story"
  storyKey?: string; // Required if level is "story"
  idOrKey?: string;
}

const AcEditorLayout: React.FC<AcEditorLayoutProps> = ({
  children,
  level,
  projectKey,
  storyKey,
  idOrKey,
}) => {
  const router = useRouter();
  const [selectedACId, setSelectedACId] = useState<string | null>(
    idOrKey || null,
  );

  const connectionQuery = useACsByConnectionQuery();
  const projectQuery = useACsByProjectQuery(projectKey);
  const storyQuery = useACsByStoryQuery(projectKey, storyKey);
  const currentQuery =
    level === "connection"
      ? connectionQuery
      : level === "project"
        ? projectQuery
        : storyQuery;

  const {
    data: acsData,
    isLoading: isACsLoading,
    refetch: refetchACs,
  } = currentQuery;

  const acs = useMemo(() => acsData?.data || [], [acsData]);

  const t = useTranslations("ac.AcEditorLayout");
  const tSessionList = useTranslations("SessionList");

  const handleSelectGherkinItem = (id: string) => {
    setSelectedACId(id);
    if (level === "connection") {
      router.push(`/app/acs/${id}`);
      return;
    }
    if (level === "story") {
      router.push(`/app/projects/${projectKey}/stories/${storyKey}/acs/${id}`);
      return;
    }
    router.push(`/app/projects/${projectKey}/acs/${id}`);
  };

  const handleNewGherkin = async (
    project: ProjectDto,
    story?: StorySummary,
  ) => {
    if (!story) {
      return null;
    }
    const newId = await acService.createAC(project.key, story.key, false);
    await refetchACs();
    return newId?.data || null;
  };

  const handleNewGherkinWithAI = async (
    project: ProjectDto,
    story?: StorySummary,
  ) => {
    if (!story) {
      return null;
    }
    const newId = await acService.createAC(project.key, story.key, true);
    await refetchACs();
    return newId?.data || null;
  };

  const sessionsComponent = (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {isACsLoading ? (
        <List
          sx={{
            flex: 1,
            minHeight: 0,
            px: 1,
            overflowY: "auto",
            ...scrollBarSx,
          }}
        >
          {[1, 2, 3].map((idx) => (
            <ListItem key={`ac-skeleton-${idx}`} disablePadding sx={{ mb: 1 }}>
              <Box
                sx={{
                  width: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  px: 1.5,
                  py: 1,
                }}
              >
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="rounded" width={160} height={22} />
                <Skeleton variant="text" width="45%" />
              </Box>
            </ListItem>
          ))}
        </List>
      ) : acs.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, px: 2 }}
        >
          {t("noAcceptanceCriteriaFound")}
          {storyKey ? ` ${t("forStory")} ${storyKey}` : ""}
        </Typography>
      ) : (
        <List
          sx={{
            flex: 1,
            minHeight: 0,
            px: 1,
            overflowY: "auto",
            ...scrollBarSx,
          }}
        >
          {acs.map((ac) => {
            const itemId = ac.key || ac.id;
            const isSelected = selectedACId === itemId;
            return (
              <ListItem key={itemId} disablePadding sx={{ mb: 0.75 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => handleSelectGherkinItem(itemId)}
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: "surfaceContainerHighest",
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{ width: "100%" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {ac.summary}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.4 }}
                    >
                      {new Date(
                        ac.updated_at || ac.created_at,
                      ).toLocaleString()}
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.75,
                      }}
                    >
                      <Chip size="small" label={`ID: ${itemId}`} />
                      <Chip
                        size="small"
                        label={`${tSessionList("project")}: ${ac.project_key}`}
                      />
                      <Chip
                        size="small"
                        label={`${tSessionList("story")}: ${ac.story_key}`}
                      />
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );

  return (
    <PageLayout
      level={level}
      headerText={t("headerText")}
      projectKey={projectKey}
      storyKey={storyKey}
      href="acs"
      sessionsComponent={sessionsComponent}
      onNewLabel={t("newGherkin")}
      dialogLabel={t("createAcceptanceCriteria")}
      primaryAction={handleNewGherkin}
      primaryActionLabel={t("create")}
      secondaryAction={handleNewGherkinWithAI}
      secondaryActionLabel={t("generateWithAI")}
      showStoryCheckbox={false}
      requireStory={true}
    >
      {children}
    </PageLayout>
  );
};

export default AcEditorLayout;
