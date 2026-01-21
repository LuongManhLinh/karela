"use client";
import { NotFound } from "@/components/NotFound";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import StoryDashboard from "./StoryDashboard";

const StoryIdPage = () => {
  const params = useParams();
  const storyKey = useMemo(() => {
    return params?.storyKey as string;
  }, [params]);

  const { selectedProject, setSelectedStory, stories } = useWorkspaceStore();

  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!selectedProject) return;

    const matchedStory = stories.find(
      (s) => s.id === storyKey || s.key === storyKey,
    );

    if (matchedStory) {
      setSelectedStory(matchedStory);
    } else {
      console.log("Story not found:", storyKey);
      console.log("Available stories:", stories);
      setNotFound(true);
    }
  }, [selectedProject, storyKey, stories, setSelectedStory]);

  if (notFound) {
    return <NotFound />;
  }

  return <StoryDashboard />;
};

export default StoryIdPage;
