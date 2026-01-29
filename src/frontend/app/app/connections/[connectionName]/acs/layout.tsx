"use client";

import AcEditorLayout from "@/components/ac/AcEditorLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

interface CLAcEditorLayoutProps {
  children?: React.ReactNode;
}

const CLAcEditorLayout: React.FC<CLAcEditorLayoutProps> = ({ children }) => {
  const params = useParams();
  const { connectionName, idOrKey } = useMemo(
    () => ({
      connectionName: params.connectionName as string,
      idOrKey: (params.idOrKey as string) || undefined,
    }),
    [params],
  );

  return (
    <AcEditorLayout
      level="connection"
      connectionName={connectionName}
      idOrKey={idOrKey}
    >
      {children}
    </AcEditorLayout>
  );
};

export default CLAcEditorLayout;
