"use client";

import AcEditorLayout from "@/components/ac/AcEditorLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

interface CLAcEditorLayoutProps {
  children?: React.ReactNode;
}

const CLAcEditorLayout: React.FC<CLAcEditorLayoutProps> = ({ children }) => {
  const params = useParams();
  const idOrKey  = useMemo(
    () => (
      params.idOrKey as string |undefined
    ),
    [params],
  );

  return (
    <AcEditorLayout
      level="connection"
      idOrKey={idOrKey}
    >
      {children}
    </AcEditorLayout>
  );
};

export default CLAcEditorLayout;
