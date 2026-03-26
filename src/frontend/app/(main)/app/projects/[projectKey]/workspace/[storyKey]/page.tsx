"use client";

import { useParams } from "next/navigation";
import WorkspacePage from "@/components/workspace/WorkspaceItemPage";
import { useMemo } from "react";

export default function StoryWorkspacePage() {
  const params = useParams();
  const { projectKey, storyKey } = useMemo(() => {
    return {
      projectKey: params.projectKey as string,
      storyKey: params.storyKey as string,
    };
  }, [params]);

  return (
    <WorkspacePage
      projectKey={projectKey}
      storyKey={storyKey}
    />
  );
}
