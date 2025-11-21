import type { Metadata } from "next";

import AnalyzePageContent from "./AnalyzePageContent";

export const metadata: Metadata = {
  title: "RatSnake Analyze",
  description: "RatSnake Analyze page description",
};

export default function ChatPage() {
  return <AnalyzePageContent />;
}
