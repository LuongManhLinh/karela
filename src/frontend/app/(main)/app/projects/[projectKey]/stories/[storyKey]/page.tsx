"use client";

import AppLoading from "@/components/AppLoading";
import { useParams } from "next/navigation";
import { useEffect } from "react";

const StoryIdPage = () => {
  const params = useParams();
  const projectKey = params.projectKey as string;
  const storyKey = params.storyKey as string;
  useEffect(() => {
    window.location.href = `/app/projects/${projectKey}/stories/${storyKey}/dashboard`;
  }, []);
  return <AppLoading />;
};

export default StoryIdPage;
