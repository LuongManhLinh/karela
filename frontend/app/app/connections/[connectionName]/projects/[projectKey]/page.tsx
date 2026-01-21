"use client";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { CircularProgress } from "@mui/material";
import ProjectDashboard from "./ProjectDashboard";

const ProjectIdPage = () => {
  const { selectedProject } = useWorkspaceStore();

  if (!selectedProject) {
    return <CircularProgress />;
  }

  return <ProjectDashboard />;
};

export default ProjectIdPage;
