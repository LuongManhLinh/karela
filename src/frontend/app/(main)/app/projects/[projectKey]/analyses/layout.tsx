"use client";

import AnalysisLayout from "@/components/analysis/AnalysisLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

interface SLAnalysisLayoutProps {
  children?: React.ReactNode;
}

const PLAnalysisLayout: React.FC<SLAnalysisLayoutProps> = ({ children }) => {
  const params = useParams();
  const { projectKey, idOrKey } = useMemo(
    () => ({
      projectKey: params.projectKey as string,
      idOrKey: (params.idOrKey as string) || undefined,
    }),
    [params],
  );
  return (
    <AnalysisLayout level="project" projectKey={projectKey} idOrKey={idOrKey}>
      {children}
    </AnalysisLayout>
  );
};

export default PLAnalysisLayout;
