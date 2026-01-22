"use client";
import ChatLayout from "@/components/chat/ChatLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

interface SLChatLayoutProps {
  children?: React.ReactNode;
}
const SLChatLayout: React.FC<SLChatLayoutProps> = ({ children }) => {
  const params = useParams();
  const { connectionName, projectKey, storyKey, idOrKey } = useMemo(
    () => ({
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
      storyKey: params.storyKey as string,
      idOrKey: (params.idOrKey as string) || undefined,
    }),
    [params],
  );
  return (
    <ChatLayout
      level="story"
      connectionName={connectionName}
      projectKey={projectKey}
      storyKey={storyKey}
      idOrKey={idOrKey}
    >
      {children}
    </ChatLayout>
  );
};

export default SLChatLayout;
