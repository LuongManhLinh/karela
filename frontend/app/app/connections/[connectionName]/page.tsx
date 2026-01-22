"use client";
import { useEffect, useMemo } from "react";
import { CircularProgress } from "@mui/material";
import { useParams, useRouter } from "next/navigation";

const ConnectionIdPage = () => {
  const params = useParams();
  const connectionName = useMemo(() => {
    return params.connectionName as string;
  }, [params]);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/app/connections/${connectionName}/projects`);
  }, [connectionName, router]);

  return <CircularProgress />;
};

export default ConnectionIdPage;
