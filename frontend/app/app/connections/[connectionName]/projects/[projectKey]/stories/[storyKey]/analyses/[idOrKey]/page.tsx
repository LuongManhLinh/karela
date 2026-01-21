"use client";

import React from "react";
import { useParams } from "next/navigation";
import AnalysisItemPage from "@/components/analysis/AnalysisItemPage";

const SLAnalysisItemPage: React.FC = () => {
  const params = useParams();

  const connectionName = params.connectionName as string;
  const projectKey = params.projectKey as string;
  const storyKey = params.storyKey as string;
  const idOrKey = params.idOrKey as string;

  return (
    <AnalysisItemPage
      connectionName={connectionName}
      projectKey={projectKey}
      storyKey={storyKey}
      idOrKey={idOrKey}
    />
  );
};

export default SLAnalysisItemPage;
