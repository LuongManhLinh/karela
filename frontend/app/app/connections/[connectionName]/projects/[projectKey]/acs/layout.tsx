"use client";

import AcEditorLayout from "@/components/ac/AcEditorLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

interface PLAcEditorLayoutProps {
  children?: React.ReactNode;
}

const PLAcEditorLayout: React.FC<PLAcEditorLayoutProps> = ({ children }) => {
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
    <AcEditorLayout
      level="project"
      connectionName={connectionName}
      projectKey={projectKey}
      idOrKey={idOrKey}
    >
      {children}
    </AcEditorLayout>
  );
};

export default PLAcEditorLayout;
