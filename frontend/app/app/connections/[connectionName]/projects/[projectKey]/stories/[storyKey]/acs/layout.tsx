"use client";

import AcEditorLayout from "@/components/ac/AcEditorLayout";
import { useParams } from "next/navigation";

interface PLAcEditorLayoutProps {
  children?: React.ReactNode;
}

const PLAcEditorLayout: React.FC<PLAcEditorLayoutProps> = ({ children }) => {
  const params = useParams();
  return (
    <AcEditorLayout
      level="story"
      connectionName={params.connectionName as string}
      projectKey={params.projectKey as string}
      storyKey={params.storyKey as string}
    >
      {children}
    </AcEditorLayout>
  );
};

export default PLAcEditorLayout;
