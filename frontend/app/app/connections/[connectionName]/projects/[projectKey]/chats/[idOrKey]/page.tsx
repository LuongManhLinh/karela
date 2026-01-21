"use client";

import ChatItemPage from "@/components/chat/ChatItemPage";
import { useParams } from "next/navigation";

const PLChatItemPage = () => {
  const params = useParams();

  const connectionName = params.connectionName as string;
  const projectKey = params.projectKey as string;
  const idOrKey = params.idOrKey as string;

  return (
    <ChatItemPage
      connectionName={connectionName}
      projectKey={projectKey}
      idOrKey={idOrKey}
    />
  );
};

export default PLChatItemPage;
