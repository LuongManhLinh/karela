"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import AnalysisItemPage from "@/components/analysis/AnalysisItemPage";

const SLAnalysisItemPage: React.FC = () => {
  const params = useParams();

  const { projectKey, storyKey, idOrKey } = useMemo(() => {
    return {
      projectKey: params.projectKey as string,
      storyKey: params.storyKey as string,
      idOrKey: params.idOrKey as string,
    };
  }, [params]);

  return (
    <AnalysisItemPage
      projectFilterKey={projectKey}
      storyFilterKey={storyKey}
      idOrKey={idOrKey}
    />
  );
};

export default SLAnalysisItemPage;
