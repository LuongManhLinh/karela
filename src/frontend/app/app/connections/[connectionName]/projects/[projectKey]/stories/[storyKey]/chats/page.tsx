"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

const StoryChatPage = () => {
  const params = useParams();
  const { connectionName, projectKey } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
    };
  }, [params]);

  const router = useRouter();

  useEffect(() => {
    router.push(
      `/app/connections/${connectionName}/projects/${projectKey}/chats`,
    );
  }, [router]);

  return null;
};

export default StoryChatPage;
