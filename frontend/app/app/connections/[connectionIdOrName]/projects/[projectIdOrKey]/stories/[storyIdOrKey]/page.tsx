"use client";
import { NotFound } from "@/components/NotFound";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import StoryDashboard from "./StoryDashboard";

const StoryIdPage = () => {
  const params = useParams();
  const storyIdOrKey = useMemo(() => {
    return params?.storyIdOrKey as string;
  }, [params]);

  const { selectedProject, setSelectedStory, stories } = useWorkspaceStore();

  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!selectedProject) return;

    const matchedStory = stories.find(
      (s) => s.id === storyIdOrKey || s.key === storyIdOrKey,
    );

    if (matchedStory) {
      setSelectedStory(matchedStory);
    } else {
      console.log("Story not found:", storyIdOrKey);
      console.log("Available stories:", stories);
      setNotFound(true);
    }
  }, [selectedProject, storyIdOrKey, stories, setSelectedStory]);

  if (notFound) {
    return <NotFound />;
  }

  return <StoryDashboard />;
};

export default StoryIdPage;
