"use client";

import React from "react";
import { useParams } from "next/navigation";
import AnalysisItemPage from "@/components/analysis/AnalysisItemPage";

const PLAnalysisItemPage: React.FC = () => {
  const params = useParams();

  const connectionName = params.connectionName as string;
  const projectKey = params.projectKey as string;
  const idOrKey = params.idOrKey as string;

  return (
    <AnalysisItemPage
      connectionName={connectionName}
      projectKey={projectKey}
      idOrKey={idOrKey}
    />
  );
};

export default PLAnalysisItemPage;
