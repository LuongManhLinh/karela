"use client";
import { useEffect, useMemo, useState } from "react";
import { NotFound } from "@/components/NotFound";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { CircularProgress } from "@mui/material";
import { useParams, useRouter } from "next/navigation";

const ConnectionIdPage = () => {
  const params = useParams();
  const connectionIdOrName = useMemo(() => {
    return params?.connectionIdOrName as string;
  }, [params]);

  const { connections, setSelectedConnection } = useWorkspaceStore();
  const [notFound, setNotFound] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (connections.length === 0) return;

    const matchedConnection = connections.find(
      (c) => c.id === connectionIdOrName || c.name === connectionIdOrName,
    );

    if (matchedConnection) {
      setSelectedConnection(matchedConnection);
      router.replace(`/app/connections/${connectionIdOrName}/projects`);
    } else {
      setNotFound(true);
    }
  }, [connections, connectionIdOrName, setSelectedConnection, router]);

  if (notFound) {
    return <NotFound />;
  }

  return <CircularProgress />;
};

export default ConnectionIdPage;
