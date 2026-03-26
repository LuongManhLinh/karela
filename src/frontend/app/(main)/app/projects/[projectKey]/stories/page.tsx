"use client";
import { useEffect, useMemo } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { CircularProgress } from "@mui/material";
import { useParams, useRouter } from "next/navigation";

const StoryPage = () => {
  const router = useRouter();
  const params = useParams();
  const { selectedStory } = useWorkspaceStore();
  const projectKey = useMemo(() => {
    return params.projectKey;
  }, [params.projectKey]);

  useEffect(() => {
    if (selectedStory) {
      router.replace(
        `/app/projects/${projectKey}/stories/${selectedStory.key}`,
      );
    }
  }, [selectedStory, projectKey, router]);

  return <CircularProgress />;
};

export default StoryPage;
