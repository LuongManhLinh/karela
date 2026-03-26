"use client";

import { useParams } from "next/navigation";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { useMemo } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const { projectKey, storyKey } = useMemo(() => {
    return {
      projectKey: params.projectKey as string,
      storyKey: params.storyKey as string,
    };
  }, [params]);

  return (
    <WorkspaceLayout projectKey={projectKey} storyKey={storyKey}>
      {children}
    </WorkspaceLayout>
  );
}
