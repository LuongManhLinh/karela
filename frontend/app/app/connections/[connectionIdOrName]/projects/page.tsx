"use client";
import { useEffect } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";

const ProjectPage = () => {
  const router = useRouter();
  const { selectedConnection, projects } = useWorkspaceStore();

  useEffect(() => {
    if (selectedConnection && projects.length > 0) {
      // Default to first project if available, or stay here?
      // Original logic was redirecting if selectedProject was set?
      // Original: 
      // if (selectedConnection && selectedProject) {
      //   router.replace(...);
      // }
      
      // Let's just list projects or something?
      // Actually the original code just redirected to selectedProject.
      // But if we are at /projects, we probably want to see a list of projects or pick one.
      // However the user request didn't specify a project list UI.
      // And the previous code only redirected if "selectedProject" was ALREADY set.
      
      // For now, let's keep it simple. If projects exist, pick the first one and go?
      // Or just render nothing / loading?
      // The original code was seemingly trying to redirect to a specific project if already selected?
      
      if (projects.length > 0) {
         router.replace(
          `/app/connections/${selectedConnection.name}/projects/${projects[0].key}`,
        );
      }
    }
  }, [selectedConnection, projects, router]);

  return <CircularProgress />;
};

export default ProjectPage;
