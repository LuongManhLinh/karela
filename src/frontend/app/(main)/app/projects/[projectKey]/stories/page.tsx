"use client";
import { useEffect, useMemo } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { Box, CircularProgress } from "@mui/material";
import { useParams, useRouter } from "next/navigation";

const StoryPage = () => {
  const router = useRouter();
  const params = useParams();
  const { selectedStory, stories, setSelectedStory } = useWorkspaceStore();
  const projectKey = useMemo(() => {
    return params.projectKey;
  }, [params.projectKey]);

  useEffect(() => {
    if (selectedStory) {
      router.replace(
        `/app/projects/${projectKey}/stories/${selectedStory.key}`,
      );
    } else if (stories.length > 0) {
      setSelectedStory(stories[0]);
      router.replace(`/app/projects/${projectKey}/stories/${stories[0].key}`);
    } else {
      router.replace(`/app/projects/${projectKey}`);
    }
  }, [selectedStory, projectKey, router]);

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default StoryPage;
