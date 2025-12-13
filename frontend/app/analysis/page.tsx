import type { Metadata } from "next";

import AnalysisPageContent from "./AnalysisPageContent";

export const metadata: Metadata = {
  title: "Karela Analysis",
  description: "Karela Analyze page description",
};

export default function ChatPage() {
  return <AnalysisPageContent />;
}
