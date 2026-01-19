"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import AcEditorItemPage from "@/components/ac/AcEditorItemPage";

export default function ProjectLevelACItemPage() {
  const params = useParams();

  const id = useMemo(() => {
    return params?.id as string;
  }, [params]);

  return <AcEditorItemPage id={id} />;
}
