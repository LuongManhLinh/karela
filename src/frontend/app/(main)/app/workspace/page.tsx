"use client";

import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppLoading from "@/components/AppLoading";
import { ServiceUnavailable } from "@/components/errors/ServiceUnavailable";

const ConnectionWorkspacePage = () => {
  const router = useRouter();
  const { projects } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (projects.length > 0) {
      router.push(`/app/projects/${projects[0].key}/workspace`);
    }

    const timer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [projects, router]);

  if (loading) {
    return <AppLoading />;
  }

  return <ServiceUnavailable />;
};

export default ConnectionWorkspacePage;
