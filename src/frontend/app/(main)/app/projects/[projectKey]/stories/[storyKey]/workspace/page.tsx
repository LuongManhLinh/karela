"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

const StoryWorkspacePage = () => {
  const params = useParams();
  const projectKey = useMemo(() => {
    return params.projectKey as string;
  }, [params.projectKey]);

  const router = useRouter();

  useEffect(() => {
    router.push(`/app/projects/${projectKey}/workspace`);
  }, [router]);

  return null;
};

export default StoryWorkspacePage;
