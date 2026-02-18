"use client";

import { useParams } from "next/navigation";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const connectionName = params.connectionName as string;
  const projectKey = params.projectKey as string;
  const storyKey = params.storyKey as string | undefined;

  return (
    <WorkspaceLayout
      connectionName={connectionName}
      projectKey={projectKey}
      storyKey={storyKey}
    >
      {children}
    </WorkspaceLayout>
  );
}
