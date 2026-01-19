"use client";

import AcEditorLayout from "@/components/ac/AcEditorLayout";

interface PLAcEditorLayoutProps {
  children?: React.ReactNode;
}

const PLAcEditorLayout: React.FC<PLAcEditorLayoutProps> = ({ children }) => {
  return <AcEditorLayout level="project">{children}</AcEditorLayout>;
};

export default PLAcEditorLayout;
