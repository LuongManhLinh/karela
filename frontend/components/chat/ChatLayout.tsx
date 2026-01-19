"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import type { ChatSessionSummary } from "@/types/chat";
import type {
  ConnectionDto,
  ProjectDto,
  StorySummary,
} from "@/types/connection";
import { SessionItem } from "@/components/SessionList";
import {
  useChatSessionsByProjectQuery,
  useChatSessionsByStoryQuery,
} from "@/hooks/queries/useChatQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { NO_STORY_FILTER, USE_NO_STORY } from "@/constants/selectable";
import { SessionStartDialog } from "@/components/SessionStartDialog";
import { chatService } from "@/services/chatService";

interface ChatLayoutProps {
  children?: React.ReactNode;
  level: "project" | "story";
}
const ChatLayout: React.FC<ChatLayoutProps> = ({ children, level }) => {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [selectedSessionKey, setSelectedSessionKey] = useState<string | null>(
    null,
  );
  const [startDialogOpen, setStartDialogOpen] = useState(false);

  const {
    connections,
    projects,
    stories,
    selectedConnection,
    setSelectedConnection,
    selectedProject,
    setSelectedProject,
    selectedStory,
    setSelectedStory,
    headerProjectKey,
    setHeaderProjectKey,
    headerStoryKey,
    setHeaderStoryKey,
  } = useWorkspaceStore();

  const { data: sessionsData, isLoading: isSessionsLoading } =
    level === "project"
      ? useChatSessionsByProjectQuery(
          selectedConnection?.id || undefined,
          selectedProject?.key || undefined,
        )
      : useChatSessionsByStoryQuery(
          selectedConnection?.id || undefined,
          selectedProject?.key || undefined,
          selectedStory?.key || undefined,
        );

  const filterableStories =
    stories.length > 0 ? [NO_STORY_FILTER, ...stories] : [];

  const basePath = useMemo(
    () =>
      level === "project"
        ? `/app/connections/${selectedConnection?.name}/projects/${selectedProject?.key}`
        : `/app/connections/${selectedConnection?.name}/projects/${selectedProject?.key}/stories/${selectedStory?.key}`,
    [level, selectedConnection, selectedProject, selectedStory],
  );

  const router = useRouter();

  // Initialize sessions
  useEffect(() => {
    if (sessionsData?.data) {
      setSessions(sessionsData.data);
    }
  }, [sessionsData]);

  const onConnectionChange = async (conn: ConnectionDto | null) => {
    setSelectedConnection(conn);
    setSelectedProject(null);
    setSelectedStory(null);
  };

  const handleProjectChange = async (proj: ProjectDto | null) => {
    setSelectedProject(proj);
    setSelectedStory(null);
  };

  const handleStoryChange = async (story: StorySummary | null) => {
    setSelectedStory(story);
  };

  const handleFilter = async () => {
    if (selectedConnection && selectedProject) {
      if (selectedStory && selectedStory.id !== NO_STORY_FILTER.id) {
        router.push(
          `/app/connections/${selectedConnection.name}/projects/${selectedProject.key}/stories/${selectedStory.key}/chats`,
        );
      } else {
        router.push(
          `/app/connections/${selectedConnection.name}/projects/${selectedProject.key}/chats`,
        );
      }
    }
  };

  const handleSelectSession = async (sessionKey: string) => {
    setSelectedSessionKey(sessionKey);
    router.push(`${basePath}/${sessionKey}`);
  };

  const handleNewChat = async (
    connection: ConnectionDto,
    project: ProjectDto,
    story: StorySummary,
  ) => {
    const newId = await chatService.createChatSession(
      connection.id,
      project.key,
      story.id === USE_NO_STORY.id ? undefined : story.key,
    );
    if (newId.data) {
      setSelectedSessionKey(newId.data);
      setSelectedConnection(connection);
      setSelectedProject(project);
      setSelectedStory(story);
      setStartDialogOpen(false);
      router.push(`${basePath}/chats/${newId.data}`);
    }
  };

  const sessionItems = useMemo<SessionItem[]>(() => {
    const items: SessionItem[] = [];
    sessions.forEach((session) => {
      items.push({
        id: session.key,
        title: session.key,
        subtitle: new Date(session.created_at).toLocaleString(),
      });
      if (session.key === selectedSessionKey) {
        setHeaderProjectKey(session.project_key);
        setHeaderStoryKey(session.story_key || "");
      }
    });
    return items;
  }, [sessions, selectedSessionKey, setHeaderProjectKey, setHeaderStoryKey]);

  return (
    <>
      <WorkspaceShell
        connectionOptions={{
          options: connections,
          onChange: onConnectionChange,
          selectedOption: selectedConnection,
        }}
        projectOptions={{
          options: projects,
          onChange: handleProjectChange,
          selectedOption: selectedProject,
        }}
        storyOptions={{
          options: filterableStories,
          onChange: handleStoryChange,
          selectedOption: selectedStory,
        }}
        primaryAction={{
          label: "Filter",
          onClick: handleFilter,
        }}
        secondaryAction={{
          label: "New Chat",
          onClick: () => setStartDialogOpen(true),
        }}
        sessions={sessionItems}
        selectedSessionId={selectedSessionKey}
        onSelectSession={handleSelectSession}
        loadingSessions={isSessionsLoading}
        emptyStateText="No chat sessions found"
        sessionListLabel="Chat Sessions"
        rightChildren={children}
        headerText="Chat"
        headerProjectKey={headerProjectKey}
        headerStoryKey={headerStoryKey}
        appBarTransparent
        basePath={`/app/connections/${selectedConnection?.name}/projects/${selectedProject?.key}`}
      />
      <SessionStartDialog
        open={startDialogOpen}
        onClose={() => setStartDialogOpen(false)}
        title="Create Chat Session"
        connectionOptions={{
          options: connections,
          selectedOption: selectedConnection,
        }}
        projectOptions={{
          options: projects,
          selectedOption: selectedProject,
        }}
        storyOptions={{
          options: [USE_NO_STORY, ...stories],
          selectedOption:
            selectedStory?.id === NO_STORY_FILTER.id
              ? USE_NO_STORY
              : selectedStory,
        }}
        onPrimarySubmit={handleNewChat}
        primaryLabel="Create"
      />
    </>
  );
};

export default ChatLayout;
