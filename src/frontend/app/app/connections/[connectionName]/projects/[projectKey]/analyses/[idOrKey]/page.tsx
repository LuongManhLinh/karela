"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import AnalysisItemPage from "@/components/analysis/AnalysisItemPage";

const PLAnalysisItemPage: React.FC = () => {
  const params = useParams();

  const { connectionName, projectKey, idOrKey } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
      idOrKey: params.idOrKey as string,
    };
  }, [params]);

  return (
    <AnalysisItemPage
      connectionName={connectionName}
      projectFilterKey={projectKey}
      idOrKey={idOrKey}
    />
  );
};

export default PLAnalysisItemPage;
