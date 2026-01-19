"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/utils/jwtUtils";
import { useStorySummariesQuery } from "@/hooks/queries/useConnectionQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { CircularProgress } from "@mui/material";

const AppLoading: React.FC = () => {
  const { selectedConnection, selectedProject, setStories } =
    useWorkspaceStore();

  const { data: storySummariesData } = useStorySummariesQuery(
    selectedConnection?.id || undefined,
    selectedProject?.key || undefined,
  );

  const router = useRouter();

  useEffect(() => {
    setStories(storySummariesData?.data || []);
  }, [storySummariesData?.data, setStories]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return <CircularProgress />;
};

export default AppLoading;
