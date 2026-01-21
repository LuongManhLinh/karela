"use client";

import ChatItemPage from "@/components/chat/ChatItemPage";
import { useParams } from "next/navigation";

const SLChatItemPage = () => {
  const params = useParams();

  const connectionName = params.connectionName as string;
  const projectKey = params.projectKey as string;
  const storyKey = params.storyKey as string;
  const idOrKey = params.idOrKey as string;

  return (
    <ChatItemPage
      connectionName={connectionName}
      projectKey={projectKey}
      storyKey={storyKey}
      idOrKey={idOrKey}
    />
  );
};

export default SLChatItemPage;
