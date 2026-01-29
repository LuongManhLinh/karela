"use client";

import AnalysisLayout from "@/components/analysis/AnalysisLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

interface CLAnalysisLayoutProps {
  children?: React.ReactNode;
}

const CLAnalysisLayout: React.FC<CLAnalysisLayoutProps> = ({ children }) => {
  const params = useParams();
  const { connectionName, idOrKey } = useMemo(
    () => ({
      connectionName: params.connectionName as string,
      idOrKey: (params.idOrKey as string) || undefined,
    }),
    [params],
  );
  return (
    <AnalysisLayout
      level="connection"
      connectionName={connectionName}
      idOrKey={idOrKey}
    >
      {children}
    </AnalysisLayout>
  );
};

export default CLAnalysisLayout;
