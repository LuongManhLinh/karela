"use client";

import React, { useMemo, } from "react";

import { useParams } from "next/navigation";
import AnalysisItemPage from "@/components/analysis/AnalysisItemPage";

const PLAnalysisItemPage: React.FC = () => {
  const params = useParams();

  const idOrKey = useMemo(() => {
    return params?.idOrKey as string;
  }, [params]);

  return <AnalysisItemPage idOrKey={idOrKey} />;
};

export default PLAnalysisItemPage;
