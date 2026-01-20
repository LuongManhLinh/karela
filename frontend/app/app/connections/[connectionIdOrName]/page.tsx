"use client";
import { useEffect } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";

const ConnectionIdPage = () => {
  const { selectedConnection } = useWorkspaceStore();
  const router = useRouter();

  useEffect(() => {
    if (selectedConnection) {
      router.replace(`/app/connections/${selectedConnection.name}/projects`);
    }
  }, [selectedConnection, router]);

  return <CircularProgress />;
};

export default ConnectionIdPage;
