"use client";

import ChatItemPage from "@/components/chat/ChatItemPage";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const SLChatItemPage = () => {
  const params = useParams();

  const { connectionName, projectKey, storyKey, idOrKey } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
      storyKey: params.storyKey as string,
      idOrKey: params.idOrKey as string,
    };
  }, [params]);

  return (
    <ChatItemPage
      connectionName={connectionName}
      projectFilterKey={projectKey}
      storyFilterKey={storyKey}
      idOrKey={idOrKey}
    />
  );
};

export default SLChatItemPage;
