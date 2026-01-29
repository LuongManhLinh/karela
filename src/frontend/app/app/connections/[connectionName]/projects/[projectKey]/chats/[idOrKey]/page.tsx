"use client";

import ChatItemPage from "@/components/chat/ChatItemPage";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const PLChatItemPage = () => {
  const params = useParams();

  const { connectionName, projectKey, idOrKey } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
      idOrKey: params.idOrKey as string,
    };
  }, [params]);

  return (
    <ChatItemPage
      connectionName={connectionName}
      projectFilterKey={projectKey}
      idOrKey={idOrKey}
    />
  );
};

export default PLChatItemPage;
