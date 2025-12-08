// app/dashboard/page.tsx
import type { Metadata } from "next";

import ChatPageContent from "./ChatPageContent";

export const metadata: Metadata = {
  title: "Karela Chat",
  description: "Karela Chat page description",
};

export default function ChatPage() {
  return <ChatPageContent />;
}
