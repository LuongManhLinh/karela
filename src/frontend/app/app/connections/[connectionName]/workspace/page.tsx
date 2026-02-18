"use client";

import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

const ConnectionWorkspacePage = () => {
  const params = useParams();
  const connectionName = useMemo(() => {
    return params?.connectionName as string;
  }, [params]);

  const router = useRouter();
  const { projects } = useWorkspaceStore();

  useEffect(() => {
    if (projects.length > 0) {
      router.push(
        `/app/connections/${connectionName}/projects/${projects[0].key}/workspace`,
      );
    }
  }, [projects, router]);

  return null;
};

export default ConnectionWorkspacePage;
