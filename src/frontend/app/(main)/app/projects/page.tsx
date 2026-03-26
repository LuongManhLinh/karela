"use client";
import { useEffect, useMemo } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";

const ProjectPage = () => {
  const router = useRouter();

  const { selectedProject} = useWorkspaceStore();

  useEffect(() => {
    if (selectedProject) {
      router.replace(
        `/app/projects/${selectedProject.key}`,
      );
    } else {
      console.log("No selected project to navigate to.");
    }
  }, [selectedProject, router]);

  return <CircularProgress />;
};

export default ProjectPage;
