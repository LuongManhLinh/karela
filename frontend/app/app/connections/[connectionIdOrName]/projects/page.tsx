"use client";
import { useEffect } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { CircularProgress, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

const ProjectPage = () => {
  const router = useRouter();
  const { selectedConnection, selectedProject } = useWorkspaceStore();

  useEffect(() => {
    if (selectedConnection && selectedProject) {
      router.replace(
        `/app/connections/${selectedConnection.name}/projects/${selectedProject.key}`,
      );
    }
  }, [selectedConnection, selectedProject, router]);

  if (!selectedConnection || !selectedProject) {
    return <Typography>Invalid connection or project</Typography>;
  }

  return <CircularProgress />;
};

export default ProjectPage;
