"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

const StoryDocumentationPage = () => {
  const params = useParams();
  const projectKey = useMemo(() => {
    return params.projectKey as string;
  }, [params.projectKey]);

  const router = useRouter();

  useEffect(() => {
    router.push(
      `/app/projects/${projectKey}/documentation`,
    );
  }, [router]);

  return null;
};

export default StoryDocumentationPage;
