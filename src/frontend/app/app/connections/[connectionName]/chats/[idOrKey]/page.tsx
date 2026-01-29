"use client";

import ChatItemPage from "@/components/chat/ChatItemPage";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const CLChatItemPage = () => {
  const params = useParams();

  const { connectionName,  idOrKey } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      idOrKey: params.idOrKey as string,
    };
  }, [params]);
  return (
    <ChatItemPage
      connectionName={connectionName}
      idOrKey={idOrKey}
    />
  );
};

export default CLChatItemPage;
