"use client";

import AcEditorLayout from "@/components/ac/AcEditorLayout";

interface PLAcEditorLayoutProps {
  children?: React.ReactNode;
}

const PLAcEditorLayout: React.FC<PLAcEditorLayoutProps> = ({ children }) => {
  return <AcEditorLayout level="story">{children}</AcEditorLayout>;
};

export default PLAcEditorLayout;
