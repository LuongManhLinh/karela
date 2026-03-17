"use client";

import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

const ConnectionWorkspacePage = () => {
  const router = useRouter();
  const { projects } = useWorkspaceStore();

  useEffect(() => {
    if (projects.length > 0) {
      router.push(`/app/projects/${projects[0].key}/documentation`);
    }
  }, [projects, router]);

  return null;
};

export default ConnectionWorkspacePage;
