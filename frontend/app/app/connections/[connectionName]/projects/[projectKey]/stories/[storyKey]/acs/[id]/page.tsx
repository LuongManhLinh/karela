"use client";

import { useParams } from "next/navigation";
import AcEditorItemPage from "@/components/ac/AcEditorItemPage";

export default function StoryLevelACItemPage() {
  const params = useParams();

  const connectionName = params.connectionName as string;
  const projectKey = params.projectKey as string;
  const storyKey = params.storyKey as string;
  const id = params.id as string;

  return (
    <AcEditorItemPage
      connectionName={connectionName}
      projectKey={projectKey}
      storyKey={storyKey}
      idOrKey={id}
    />
  );
}
