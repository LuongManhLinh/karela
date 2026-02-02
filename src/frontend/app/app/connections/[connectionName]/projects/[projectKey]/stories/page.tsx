"use client";
import { useEffect, useMemo } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { CircularProgress } from "@mui/material";
import { useParams, useRouter } from "next/navigation";

const StoryPage = () => {
  const router = useRouter();
  const params = useParams();
  const { selectedStory: selectedStory } = useWorkspaceStore();
  const { connectionName, projectKey } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
    };
  }, [params]);

  useEffect(() => {
    if (selectedStory) {
      router.replace(
        `/app/connections/${connectionName}/projects/${projectKey}/stories/${selectedStory.key}`,
      );
    }
  }, [selectedStory, connectionName, projectKey, router]);

  return <CircularProgress />;
};

export default StoryPage;
