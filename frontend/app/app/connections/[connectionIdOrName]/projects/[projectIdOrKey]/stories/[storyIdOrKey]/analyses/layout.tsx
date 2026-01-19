"use client";

import AnalysisLayout from "@/components/analysis/AnalysisLayout";

interface SLAnalysisLayoutProps {
  children?: React.ReactNode;
}

const PLAnalysisLayout: React.FC<SLAnalysisLayoutProps> = ({ children }) => {
  return <AnalysisLayout level="story">{children}</AnalysisLayout>;
};

export default PLAnalysisLayout;
