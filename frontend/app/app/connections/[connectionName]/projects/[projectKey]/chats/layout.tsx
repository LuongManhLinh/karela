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
      level="project"
      connectionName={params.connectionName as string}
      projectKey={params.projectKey as string}
    >
      {children}
    </ChatLayout>
  );
};

export default PLChatLayout;
