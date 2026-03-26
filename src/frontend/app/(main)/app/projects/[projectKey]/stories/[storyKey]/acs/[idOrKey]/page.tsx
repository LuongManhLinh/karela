"use client";

import { useParams } from "next/navigation";
import AcEditorItemPage from "@/components/ac/AcEditorItemPage";
import { useMemo } from "react";

export default function StoryLevelACItemPage() {
  const params = useParams();

  const idOrKey = useMemo(() => {
    return params.idOrKey as string;
  }, [params.idOrKey]);

  return <AcEditorItemPage idOrKey={idOrKey} />;
}
