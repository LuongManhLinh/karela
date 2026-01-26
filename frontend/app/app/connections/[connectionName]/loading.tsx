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

  console.log("Loading projects for connection:", selectedConnection);

  useEffect(() => {
    console.log("Fetched projects:", projectDtosData?.data);
    setProjects(projectDtosData?.data || []);
  }, [projectDtosData?.data, setProjects]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      console.log("Auto-selecting project:", projects[0]);
      setSelectedProject(projects[0]);
    } else if (projects.length === 0 && selectedProject) {
      setSelectedProject(null);
    }
  }, [projects, selectedProject, setSelectedProject]);

  return <CircularProgress />;
};

export default ConnectionItemLoading;
