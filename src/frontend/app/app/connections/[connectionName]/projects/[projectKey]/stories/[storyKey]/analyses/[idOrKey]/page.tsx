"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import AnalysisItemPage from "@/components/analysis/AnalysisItemPage";

const SLAnalysisItemPage: React.FC = () => {
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
    <AnalysisItemPage
      connectionName={connectionName}
      projectFilterKey={projectKey}
      storyFilterKey={storyKey}
      idOrKey={idOrKey}
    />
  );
};

export default SLAnalysisItemPage;
