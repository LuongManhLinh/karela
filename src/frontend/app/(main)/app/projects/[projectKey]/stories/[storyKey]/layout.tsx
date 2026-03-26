"use client";

import AppLoading from "@/components/AppLoading";
import { StoryNotFound } from "@/components/errors/StoryNotFound";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const StoryLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const params = useParams();
  const storyKey = useMemo(() => {
    return params.storyKey as string;
  }, [params]);

  const [isValidStory, setIsValidStory] = useState<boolean | null>(null);

  const { stories } = useWorkspaceStore();

  useEffect(() => {
    const story = stories.find((s) => s.key === storyKey);
    if (story) {
      setIsValidStory(true);
    } else {
      setIsValidStory(false);
    }
  }, [storyKey, stories]);

  if (isValidStory === null) {
    return <AppLoading />;
  }

  if (!isValidStory) {
    return <StoryNotFound />;
  }

  return children;
};

export default StoryLayout;
