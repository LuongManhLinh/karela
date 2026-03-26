"use client";

import AcEditorLayout from "@/components/ac/AcEditorLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

interface PLAcEditorLayoutProps {
  children?: React.ReactNode;
}

const SLAcEditorLayout: React.FC<PLAcEditorLayoutProps> = ({ children }) => {
  const params = useParams();
  const { projectKey, storyKey, idOrKey } = useMemo(
    () => ({
      projectKey: params.projectKey as string,
      storyKey: params.storyKey as string,
      idOrKey: (params.idOrKey as string) || undefined,
    }),
    [params],
  );

  return (
    <AcEditorLayout
      level="story"
      projectKey={projectKey}
      storyKey={storyKey}
      idOrKey={idOrKey}
    >
      {children}
    </AcEditorLayout>
  );
};

export default SLAcEditorLayout;
