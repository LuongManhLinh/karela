"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/utils/jwtUtils";
import { useProjectDtosQuery } from "@/hooks/queries/useConnectionQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { CircularProgress } from "@mui/material";

const ConnectionItemLoading: React.FC = () => {
  const {
    selectedConnection,
    selectedProject,
    setSelectedProject,
    setProjects,
    projects,
  } = useWorkspaceStore();

  const { data: projectDtosData } = useProjectDtosQuery(
    selectedConnection?.id || undefined,
  );

  const router = useRouter();

  useEffect(() => {
    setProjects(projectDtosData?.data || []);
  }, [projectDtosData?.data, setProjects]);

  // Initialize project key
  useEffect(() => {
    // If we have keys but no selection (or selection invalid), select first
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    } else if (projects.length === 0 && selectedProject) {
      // Clear selection if no keys
      setSelectedProject(null);
    }
  }, [projects, selectedProject, setSelectedProject]);
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return <CircularProgress />;
};

export default ConnectionItemLoading;
