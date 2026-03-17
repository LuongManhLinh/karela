"use client";
import ChatLayout from "@/components/chat/ChatLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

interface PLChatLayoutProps {
  children?: React.ReactNode;
}
const PLChatLayout: React.FC<PLChatLayoutProps> = ({ children }) => {
  const params = useParams();
  const { projectKey, idOrKey } = useMemo(
    () => ({
      projectKey: params.projectKey as string,
      idOrKey: (params.idOrKey as string) || undefined,
    }),
    [params],
  );
  return (
    <ChatLayout level="project" projectKey={projectKey} idOrKey={idOrKey}>
      {children}
    </ChatLayout>
  );
};

export default PLChatLayout;
