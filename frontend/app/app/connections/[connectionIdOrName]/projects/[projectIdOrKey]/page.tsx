"use client";
import { NotFound } from "@/components/NotFound";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ProjectDashboard from "./ProjectDashboard";

const ProjectIdPage = () => {
  const params = useParams();
  const projectIdOrKey = useMemo(() => {
    return params?.projectIdOrKey as string;
  }, [params]);

  const { selectedConnection, selectedProject, projects, setSelectedProject } =
    useWorkspaceStore();

  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!selectedConnection) return;

    const matchedProject = projects.find(
      (p) => p.id === projectIdOrKey || p.key === projectIdOrKey,
    );

    if (matchedProject) {
      setSelectedProject(matchedProject);
    } else {
      console.log("Project not found:", projectIdOrKey);
      console.log("Available projects:", projects);
      setNotFound(true);
    }
  }, [selectedConnection, projectIdOrKey, projects, setSelectedProject]);

  if (notFound) {
    return <NotFound />;
  }

  return <ProjectDashboard />;
};

export default ProjectIdPage;
