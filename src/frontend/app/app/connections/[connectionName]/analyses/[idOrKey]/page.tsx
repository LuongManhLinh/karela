"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import AnalysisItemPage from "@/components/analysis/AnalysisItemPage";

const CLAnalysisItemPage: React.FC = () => {
  const params = useParams();

  const { connectionName, idOrKey } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      idOrKey: params.idOrKey as string,
    };
  }, [params]);

  return <AnalysisItemPage connectionName={connectionName} idOrKey={idOrKey} />;
};

export default CLAnalysisItemPage;
