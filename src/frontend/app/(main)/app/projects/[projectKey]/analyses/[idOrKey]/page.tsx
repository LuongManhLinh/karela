"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import AnalysisItemPage from "@/components/analysis/AnalysisItemPage";

const PLAnalysisItemPage: React.FC = () => {
  const params = useParams();

  const { projectKey, idOrKey } = useMemo(() => {
    return {
      projectKey: params.projectKey as string,
      idOrKey: params.idOrKey as string,
    };
  }, [params]);

  return <AnalysisItemPage projectFilterKey={projectKey} idOrKey={idOrKey} />;
};

export default PLAnalysisItemPage;
