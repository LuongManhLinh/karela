"use client";
import { useEffect, useMemo } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { CircularProgress } from "@mui/material";
import { useParams, useRouter } from "next/navigation";

const ProjectPage = () => {
  const router = useRouter();

  const params = useParams();
  const { selectedProject: selectedProject } = useWorkspaceStore();
  const connectionName = useMemo(() => {
    return params.connectionName as string;
  }, [params]);

  useEffect(() => {
    if (selectedProject) {
      router.replace(
        `/app/connections/${connectionName}/projects/${selectedProject.key}`,
      );
    } else {
      console.log("No selected project to navigate to.");
    }
  }, [selectedProject, connectionName, router]);

  return <CircularProgress />;
};

export default ProjectPage;
