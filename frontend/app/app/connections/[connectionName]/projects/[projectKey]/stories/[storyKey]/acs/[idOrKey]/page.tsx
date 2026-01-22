"use client";

import { useParams } from "next/navigation";
import AcEditorItemPage from "@/components/ac/AcEditorItemPage";
import { useMemo } from "react";

export default function StoryLevelACItemPage() {
  const params = useParams();

  const { connectionName, projectKey, storyKey, idOrKey } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
      storyKey: params.storyKey as string,
      idOrKey: params.idOrKey as string,
    };
  }, [params]);

  return (
    <AcEditorItemPage
      connectionName={connectionName}
      projectKey={projectKey}
      storyKey={storyKey}
      idOrKey={idOrKey}
    />
  );
}
