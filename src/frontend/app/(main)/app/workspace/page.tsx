"use client";

import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ConnectionWorkspacePage = () => {
  const router = useRouter();
  const { projects } = useWorkspaceStore();

  useEffect(() => {
    if (projects.length > 0) {
      router.push(`/app/projects/${projects[0].key}/workspace`);
    }
  }, [projects, router]);

  return null;
};

export default ConnectionWorkspacePage;
