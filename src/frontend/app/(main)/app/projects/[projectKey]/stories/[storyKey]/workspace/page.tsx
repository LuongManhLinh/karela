"use client";

import AppLoading from "@/components/AppLoading";
import { ServiceUnavailable } from "@/components/errors/ServiceUnavailable";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const StoryWorkspacePage = () => {
  const params = useParams();
  const projectKey = useMemo(() => {
    return params.projectKey as string;
  }, [params.projectKey]);

  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    router.push(`/app/projects/${projectKey}/workspace`);

    const timer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [projectKey, router]);

  if (loading) {
    return <AppLoading />;
  }

  return <ServiceUnavailable />;
};

export default StoryWorkspacePage;
