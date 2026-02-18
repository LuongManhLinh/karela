"use client";

import { useParams } from "next/navigation";
import WorkspacePage from "@/components/workspace/WorkspacePage";

export default function StoryWorkspacePage() {
  const params = useParams();
  const connectionName = params.connectionName as string;
  const projectKey = params.projectKey as string;
  const storyKey = params.storyKey as string;

  return (
    <WorkspacePage
      connectionName={connectionName}
      projectKey={projectKey}
      storyKey={storyKey}
    />
  );
}
