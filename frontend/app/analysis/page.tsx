import type { Metadata } from "next";

import AnalysisPageContent from "./AnalysisPageContent";

export const metadata: Metadata = {
  title: "RatSnake Analyze",
  description: "RatSnake Analyze page description",
};

export default function ChatPage() {
  return <AnalysisPageContent />;
}
