"use client";

import ChatLayout from "@/components/chat/ChatLayout";
import { useParams } from "next/navigation";

interface PLChatLayoutProps {
  children?: React.ReactNode;
}
const PLChatLayout: React.FC<PLChatLayoutProps> = ({ children }) => {
  const params = useParams();
  return (
    <ChatLayout
      level="story"
      connectionName={params.connectionName as string}
      projectKey={params.projectKey as string}
      storyKey={params.storyKey as string}
    >
      {children}
    </ChatLayout>
  );
};

export default PLChatLayout;
