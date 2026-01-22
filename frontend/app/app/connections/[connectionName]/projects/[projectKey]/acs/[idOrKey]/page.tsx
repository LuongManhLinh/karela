"use client";

import { useParams } from "next/navigation";
import AcEditorItemPage from "@/components/ac/AcEditorItemPage";
import { useMemo } from "react";

export default function ProjectLevelACItemPage() {
  const params = useParams();

  const { connectionName, projectKey, idOrKey } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
      idOrKey: params.idOrKey as string,
    };
  }, [params]);

  return (
    <AcEditorItemPage
      connectionName={connectionName}
      projectKey={projectKey}
      idOrKey={idOrKey}
    />
  );
}
