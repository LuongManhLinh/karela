"use client";
import { useEffect, useMemo } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { Box, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";

const ProjectPage = () => {
  const router = useRouter();

  const { selectedProject, setSelectedProject, projects } = useWorkspaceStore();

  useEffect(() => {
    if (selectedProject) {
      router.replace(`/app/projects/${selectedProject.key}`);
    } else {
      if (projects.length > 0) {
        setSelectedProject(projects[0]);
        router.replace(`/app/projects/${projects[0].key}`);
      } else {
        router.replace(`/app/`);
      }
    }
  }, [selectedProject, router]);

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

export default ProjectPage;
