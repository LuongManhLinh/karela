"use client";

import ChatItemPage from "@/components/chat/ChatItemPage";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const PLChatItemPage = () => {
  const params = useParams();

  const { projectKey, idOrKey } = useMemo(() => {
    return {
      projectKey: params.projectKey as string,
      idOrKey: params.idOrKey as string,
    };
  }, [params]);

  return <ChatItemPage projectFilterKey={projectKey} idOrKey={idOrKey} />;
};

export default PLChatItemPage;
