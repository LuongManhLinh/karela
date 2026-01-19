"use client";

import { useEffect } from "react";
import { NoConnection } from "@/components/NoConnection";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";

const ConnectionPage = () => {
  const router = useRouter();
  const { selectedConnection } = useWorkspaceStore();

  useEffect(() => {
    if (selectedConnection) {
      router.replace(`/app/connections/${selectedConnection.id}/projects`);
    }
  }, [selectedConnection, router]);

  if (!selectedConnection) {
    return <NoConnection />;
  }

  return <CircularProgress />;
};

export default ConnectionPage;
