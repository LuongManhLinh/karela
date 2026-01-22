"use client";

import AnalysisLayout from "@/components/analysis/AnalysisLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

interface SLAnalysisLayoutProps {
  children?: React.ReactNode;
}

const PLAnalysisLayout: React.FC<SLAnalysisLayoutProps> = ({ children }) => {
  const params = useParams();
  const { connectionName, projectKey, idOrKey } = useMemo(
    () => ({
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
      idOrKey: (params.idOrKey as string) || undefined,
    }),
    [params],
  );
  return (
    <AnalysisLayout
      level="project"
      connectionName={connectionName}
      projectKey={projectKey}
      idOrKey={idOrKey}
    >
      {children}
    </AnalysisLayout>
  );
};

export default PLAnalysisLayout;
