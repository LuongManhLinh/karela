import ChatItemPage from "@/components/chat/ChatItemPage";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const PLChatItemPage = () => {
  const params = useParams();
  const idOrKey = useMemo(() => {
    return params?.idOrKey as string;
  }, [params]);

  return <ChatItemPage idOrKey={idOrKey} />;
};

export default PLChatItemPage;
