"use client";
import ChatLayout from "@/components/chat/ChatLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

interface CLChatLayoutProps {
  children?: React.ReactNode;
}
const CLChatLayout: React.FC<CLChatLayoutProps> = ({ children }) => {
  const params = useParams();
  const { connectionName, idOrKey } = useMemo(
    () => ({
      connectionName: params.connectionName as string,
      idOrKey: (params.idOrKey as string) || undefined,
    }),
    [params],
  );
  return (
    <ChatLayout
      level="connection"
      connectionName={connectionName}
      idOrKey={idOrKey}
    >
      {children}
    </ChatLayout>
  );
};

export default CLChatLayout;
