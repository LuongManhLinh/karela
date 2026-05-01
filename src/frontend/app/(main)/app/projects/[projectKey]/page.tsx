"use client";

import AppLoading from "@/components/AppLoading";
import { useParams } from "next/navigation";
import { useEffect } from "react";

const ProjectIdPage = () => {
  const params = useParams();
  const projectKey = params.projectKey as string;
  useEffect(() => {
    window.location.href = `/app/projects/${projectKey}/dashboard`;
  }, []);

  return <AppLoading />;
};

export default ProjectIdPage;
