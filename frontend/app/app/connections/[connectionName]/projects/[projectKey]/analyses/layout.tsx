"use client";

import AnalysisLayout from "@/components/analysis/AnalysisLayout";
import { useParams } from "next/navigation";

interface SLAnalysisLayoutProps {
  children?: React.ReactNode;
}

const PLAnalysisLayout: React.FC<SLAnalysisLayoutProps> = ({ children }) => {
  const params = useParams();
  return (
    <AnalysisLayout
      level="project"
      connectionName={params.connectionName as string}
      projectKey={params.projectKey as string}
    >
      {children}
    </AnalysisLayout>
  );
};

export default PLAnalysisLayout;
