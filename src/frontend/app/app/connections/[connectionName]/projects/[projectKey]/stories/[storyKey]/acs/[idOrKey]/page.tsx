"use client";

import { useParams } from "next/navigation";
import AcEditorItemPage from "@/components/ac/AcEditorItemPage";
import { useMemo } from "react";

export default function StoryLevelACItemPage() {
  const params = useParams();

  const { connectionName, idOrKey } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      idOrKey: params.idOrKey as string,
    };
  }, [params]);

  return <AcEditorItemPage connectionName={connectionName} idOrKey={idOrKey} />;
}
