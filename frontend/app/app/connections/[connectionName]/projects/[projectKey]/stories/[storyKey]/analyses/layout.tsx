"use client";

import AnalysisLayout from "@/components/analysis/AnalysisLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

interface SLAnalysisLayoutProps {
  children?: React.ReactNode;
}

const SLAnalysisLayout: React.FC<SLAnalysisLayoutProps> = ({ children }) => {
  const params = useParams();
  const { connectionName, projectKey, storyKey, idOrKey } = useMemo(
    () => ({
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
      storyKey: params.storyKey as string,
      idOrKey: (params.idOrKey as string) || undefined,
    }),
    [params],
  );
  return (
    <AnalysisLayout
      level="story"
      connectionName={connectionName}
      projectKey={projectKey}
      storyKey={storyKey}
      idOrKey={idOrKey}
    >
      {children}
    </AnalysisLayout>
  );
};

export default SLAnalysisLayout;
