"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Paper,
  TextField,
  Typography,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Chip,
  Skeleton,
  useTheme,
} from "@mui/material";
import { Send, ExpandLess } from "@mui/icons-material";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ErrorMessage } from "@/components/chat/ErrorMessage";
import { FunctionCallMessage } from "@/components/chat/FunctionCallMessage";
import { ToolMessage } from "@/components/chat/ToolMessage";
import { AnalysisProgressMessage } from "@/components/chat/AnalysisProgressMessage";
import { chatService } from "@/services/chatService";
import { proposalService } from "@/services/proposalService";
import { ErrorSnackbar } from "@/components/ErrorSnackbar";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import type {
  ProposalDto,
  ProposalContentDto,
  ProposalActionFlag,
} from "@/types/proposal";
import type {
  ChatSessionSummary,
  ChatSessionDto,
  ChatMessageDto,
  MessageRole,
  MessageChunk,
} from "@/types/chat";
import type { JiraConnectionDto } from "@/types/integration";
import { userService } from "@/services/userService";
import { ProposalCard } from "@/components/proposals/ProposalCard";
import { SessionItem } from "@/components/SessionList";
import { getToken } from "@/utils/jwt_utils";

const WS_BASE_URL = "ws://localhost:8000/api/v1/chat/";

const MemoizedTextField = React.memo(TextField);

const ChatSection: React.FC<{
  sendMessage: (message: string) => void;
  disabled: boolean;
}> = ({ sendMessage, disabled }) => {
  const [userMessage, setUserMessage] = useState("");
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "center",
        scrollbarColor: "#6b6b6b transparent",
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": {
          width: "10px",
          height: "10px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "#2b2b2b",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#6b6b6b",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "#555",
        },
      }}
    >
      <MemoizedTextField
        variant="outlined"
        fullWidth
        multiline
        maxRows={12}
        placeholder="Type your message..."
        value={userMessage}
        onChange={(e) => setUserMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            sendMessage(userMessage);
            setUserMessage("");
          }
        }}
        disabled={disabled}
        sx={{
          "& fieldset": { border: "none" },
        }}
        InputProps={{
          disableUnderline: true,
          style: {
            paddingBottom: 0,
            paddingTop: 0,
          },
        }}
      />
      <Box>
        <IconButton
          onClick={() => {
            console.log("User sending message:", userMessage);
            sendMessage(userMessage);
            setUserMessage("");
          }}
          disabled={disabled}
          sx={{ backgroundColor: disabled ? undefined : "white" }}
        >
          <ArrowUpwardIcon color="info" />
        </IconButton>
      </Box>
    </Box>
  );
};

const ChatPageContent: React.FC = () => {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSessionDto | null>(
    null
  );
  const [connections, setConnections] = useState<JiraConnectionDto[]>([]);
  const [loadingConnections, setLoadingConnections] = useState<boolean>(true);
  const [selectedConnection, setSelectedConnnection] =
    useState<JiraConnectionDto | null>(null);

  const [projectKeys, setProjectKeys] = useState<string[]>([]);
  const [projectKey, setProjectKey] = useState("");

  const [storyKeys, setStoryKeys] = useState<string[]>([]);
  const [storyKey, setStoryKey] = useState("");
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [sessionProposals, setSessionProposals] = useState<ProposalDto[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  // Separate streaming state - isolate active stream from history
  const streamingIdRef = useRef<string | null>(null);
  const streamingRoleRef = useRef<MessageRole | null>(null);

  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [streamingRole, setStreamingRole] = useState<MessageRole | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [bufferUpdateTrigger, setBufferUpdateTrigger] = useState(0);

  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [proposalExpanded, setProposalExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const streamingBufferRef = useRef<string>("");
  const animationFrameRef = useRef<number | null>(null);
  const displayedLengthRef = useRef<number>(0);
  const lastChunkTimeRef = useRef<number>(Date.now());
  const isCommittingRef = useRef<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  const theme = useTheme();

  // Smooth streaming animation effect
  useEffect(() => {
    if (!streamingId) {
      return;
    }

    let frameId: number | null = null;

    const animateStreaming = () => {
      const buffer = streamingBufferRef.current;
      const currentDisplayed = displayedLengthRef.current;

      if (currentDisplayed < buffer.length) {
        // Calculate how many characters to add
        const now = Date.now();
        const timeSinceLastChunk = now - lastChunkTimeRef.current;

        // Adaptive speed: 3-20 chars per frame based on chunk arrival speed
        const charsPerFrame = Math.min(
          20,
          Math.max(3, Math.floor(100 / Math.max(timeSinceLastChunk, 10)))
        );

        const newLength = Math.min(
          buffer.length,
          currentDisplayed + charsPerFrame
        );
        const newContent = buffer.substring(0, newLength);

        displayedLengthRef.current = newLength;
        setStreamingContent(newContent);

        // Continue animation only if there's more to display
        frameId = requestAnimationFrame(animateStreaming);
      } else {
        // Caught up with buffer, stop animation
        frameId = null;
      }
    };

    // Start animation
    frameId = requestAnimationFrame(animateStreaming);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [streamingId, bufferUpdateTrigger]);

  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // Throttled scroll - only scroll once every 100ms during streaming
  useEffect(() => {
    if (scrollThrottleRef.current) {
      clearTimeout(scrollThrottleRef.current);
    }

    scrollThrottleRef.current = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => {
      if (scrollThrottleRef.current) {
        clearTimeout(scrollThrottleRef.current);
      }
    };
  }, [messages, streamingContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Close WebSocket if still open
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      // Cancel animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  const loadConnections = async () => {
    setLoadingConnections(true);
    try {
      const response = await userService.getUserConnections();
      if (response.data) {
        const jiraConnections = response.data.jira_connections || [];
        setConnections(jiraConnections);
        if (jiraConnections.length > 0) {
          const firstConn = jiraConnections[0];
          setSelectedConnnection(firstConn);
          await onConnectionChange(firstConn);
        }
      }
    } catch (err) {
      console.error("Failed to load connections:", err);
    } finally {
      setLoadingConnections(false);
    }
  };

  const onConnectionChange = async (conn: JiraConnectionDto) => {
    setSelectedConnnection(conn);
    setCurrentSession(null);
    setMessages([]);
    setSessionProposals([]);
    await loadSessions(conn.id);
    await loadProjectKeys(conn.id);
  };

  const loadProjectKeys = async (connId: string) => {
    try {
      const response = await userService.getProjectKeys(connId);
      if (response.data) {
        setProjectKeys(response.data);
        if (response.data.length > 0) {
          setProjectKey(response.data[0]);
          await loadStoryKeys(connId, response.data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load project keys:", err);
    }
  };

  const onProjectKeyChange = async (projKey: string) => {
    setProjectKey(projKey);
    setStoryKey("");
    setStoryKeys([]);
    await loadStoryKeys(selectedConnection!.id, projKey);
  };

  const loadStoryKeys = async (connId: string, projKey: string) => {
    try {
      const response = await userService.getIssueKeys(connId, projKey);
      if (response.data) {
        setStoryKeys(["None", ...response.data]);
        setStoryKey("None");
      }
    } catch (err) {
      console.error("Failed to load story keys:", err);
    }
  };

  const onStoryKeyChange = (sKey: string) => {
    setStoryKey(sKey);
  };

  const fetchSessionProposals = useCallback(
    async (sessionId: string | null) => {
      if (!sessionId) {
        setSessionProposals([]);
        return;
      }
      setLoadingProposals(true);
      try {
        const response = await proposalService.getProposalsBySession(
          sessionId,
          "CHAT"
        );
        setSessionProposals(response.data || []);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail || "Failed to load proposals";
        setError(errorMessage);
        setShowError(true);
      } finally {
        setLoadingProposals(false);
      }
    },
    []
  );

  const handleIncomingProposal = useCallback(
    async (proposalId: string) => {
      try {
        const response = await proposalService.getProposal(proposalId);
        const proposal = response.data;
        if (!proposal) {
          return;
        }
        if (currentSession?.id && proposal.session_id !== currentSession.id) {
          return;
        }
        setSessionProposals((prev) => {
          const filtered = prev.filter((p) => p.id !== proposal.id);
          return [proposal, ...filtered];
        });
      } catch (err) {
        console.error("Failed to fetch proposal:", err);
      }
    },
    [currentSession?.id]
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadSessions = useCallback(async (connId: string) => {
    setLoadingSessions(true);
    try {
      const response = await chatService.listChatSessions(connId);
      if (response.data) {
        setSessions(response.data);
      }
    } catch (err: any) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const loadSession = useCallback(
    async (sessionId: string) => {
      try {
        const response = await chatService.getChatSession(sessionId);
        setCurrentSession(response.data);
        setProjectKey(response.data?.project_key || "");
        setMessages(response.data?.messages || []);
        await fetchSessionProposals(sessionId);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail || "Failed to load session";
        setError(errorMessage);
        setShowError(true);
      }
    },
    [sessions, currentSession, projectKey, fetchSessionProposals]
  );

  const handleSelectSession = async (sessionId: string) => {
    await loadSession(sessionId);
  };

  const handleNewChat = () => {
    setCurrentSession({
      id: "",
      key: "",
      project_key: projectKey,
      story_key: storyKey === "None" ? "" : storyKey,
      created_at: new Date().toISOString(),
      messages: [],
    });
    setMessages([]);
    setSessionProposals([]);
  };

  // Commit streaming message to history when stream ends
  const commitStreamingMessage = useCallback(() => {
    // Prevent multiple commits
    if (isCommittingRef.current) {
      console.log("Already committing, skipping duplicate commit");
      return;
    }

    if (streamingIdRef.current && streamingRoleRef.current) {
      isCommittingRef.current = true;

      // Cancel any ongoing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Use the full buffer content, not the partially displayed content
      const finalContent = streamingBufferRef.current;
      const messageId = streamingIdRef.current;
      const messageRole = streamingRoleRef.current;

      console.log("Committing streaming message:", messageId);

      // Check if message already exists in history (avoid duplicates)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === messageId);
        if (exists) {
          console.log("Message already exists in history, skipping");
          return prev;
        }

        const newMsg: ChatMessageDto = {
          id: messageId,
          role: messageRole,
          content: finalContent,
          created_at: new Date().toISOString(),
        };

        return [...prev, newMsg];
      });

      console.log("Streaming message committed:", messageId);

      // Reset all streaming state
      setStreamingContent("");
      setStreamingRole(null);
      setStreamingId(null);
      streamingIdRef.current = null;
      streamingRoleRef.current = null;
      streamingBufferRef.current = "";
      displayedLengthRef.current = 0;

      // // Reset commit flag after a short delay
      // setTimeout(() => {
      //   isCommittingRef.current = false;
      // }, 100);
      isCommittingRef.current = false;
    } else {
      console.log("No active streaming message to commit");
    }
  }, [streamingIdRef, streamingRoleRef]);

  const handleMessageChunk = useCallback(
    (chunk: MessageChunk) => {
      const chunkId = chunk.id;
      const chunkRole = (chunk.role || "agent") as MessageRole;
      const chunkContent = chunk.content || "";

      // Check if this is a NEW message (different ID from current streaming message)
      if (streamingIdRef.current && streamingIdRef.current !== chunkId) {
        console.log("New message detected, committing previous message first");
        // Commit the previous streaming message before starting a new one
        commitStreamingMessage();
      }

      if (!streamingIdRef.current || streamingIdRef.current !== chunkId) {
        console.log("Starting new streaming message:", chunkId);
        streamingIdRef.current = chunkId;
        streamingBufferRef.current = chunkContent;
        displayedLengthRef.current = 0;
        lastChunkTimeRef.current = Date.now();
        isCommittingRef.current = false;
        setStreamingId(chunkId);
        setStreamingRole(chunkRole);
        streamingRoleRef.current = chunkRole;
        setStreamingContent("");
        setBufferUpdateTrigger((prev) => prev + 1);
      } else {
        // Append to buffer for the same message ID
        streamingBufferRef.current += chunkContent;
        lastChunkTimeRef.current = Date.now();
        // Trigger animation
        setBufferUpdateTrigger((prev) => prev + 1);
      }
    },
    [commitStreamingMessage]
  );

  const connectWebSocket = useCallback(
    (
      connId: string,
      projKey: string,
      userMessage: string,
      storyKey?: string,
      sessionId?: string
    ) => {
      const token = getToken();
      if (!token) {
        setError("No authentication token found");
        setShowError(true);
        return;
      }

      // Close existing WebSocket if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      setConnecting(true);
      setError("");

      try {
        const ws = new WebSocket(WS_BASE_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          // Send initialization message
          const initMessage: any = {
            token,
            connection_id: connId,
            project_key: projKey,
            story_key: storyKey === "None" ? null : storyKey || null,
            session_id: sessionId || null,
          };

          // Include user message if provided (backend may not use it yet)
          initMessage.user_message = userMessage;

          ws.send(JSON.stringify(initMessage));
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);

            if (parsed.type === "message") {
              const chunkData = parsed.data as MessageChunk;
              handleMessageChunk(chunkData);
            } else if (parsed.type === "session_id") {
              const newSessionId = parsed.data;
              if (newSessionId && !sessionId) {
                setCurrentSession(
                  (prev) =>
                    ({
                      ...prev!,
                      id: newSessionId,
                    } as ChatSessionDto)
                );
                loadSessions(connId);
                fetchSessionProposals(newSessionId);
                // Don't reload session immediately - let streaming finish
              }
            } else if (parsed.type === "proposal" && parsed.data) {
              handleIncomingProposal(parsed.data);
            }
          } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setError("WebSocket connection error");
          setShowError(true);
          setConnecting(false);
          commitStreamingMessage();
        };

        ws.onclose = () => {
          console.log("WebSocket closed");
          setConnecting(false);
          wsRef.current = null;

          // Commit any active streaming message before closing
          commitStreamingMessage();
        };
      } catch (err) {
        console.log("Error connecting to chat server:", err);
        setError((err as Error).message || "Failed to connect to chat server");
        setShowError(true);
        setConnecting(false);
      }
    },
    [
      handleMessageChunk,
      commitStreamingMessage,
      loadSessions,
      currentSession?.id,
      fetchSessionProposals,
      handleIncomingProposal,
    ]
  );

  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || !selectedConnection || !projectKey) {
      return;
    }

    const messageToSend = userMessage.trim();

    // Add user message to UI immediately
    const userMsg: ChatMessageDto = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    connectWebSocket(
      selectedConnection.id,
      projectKey,
      messageToSend,
      storyKey || undefined,
      currentSession?.id || undefined
    );
  };

  const renderMessage = (message: ChatMessageDto) => {
    switch (message.role) {
      case "user":
      case "agent":
        return <MessageBubble key={message.id} message={message} />;
      case "error":
        return <ErrorMessage key={message.id} message={message} />;
      case "agent_function_call":
        return <FunctionCallMessage key={message.id} message={message} />;
      case "tool":
        return <ToolMessage key={message.id} message={message} />;
      case "analysis_progress":
        return <AnalysisProgressMessage key={message.id} message={message} />;
      default:
        return <MessageBubble key={message.id} message={message} />;
    }
  };

  const handleProposalAction = useCallback(
    async (proposalId: string, flag: ProposalActionFlag) => {
      if (!currentSession?.id) return;
      try {
        await proposalService.actOnProposal(proposalId, flag);
        await fetchSessionProposals(currentSession.id);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail || "Failed to update proposal";
        setError(errorMessage);
        setShowError(true);
      }
    },
    [currentSession?.id, fetchSessionProposals]
  );

  const handleProposalContentAction = useCallback(
    async (
      proposalId: string,
      content: ProposalContentDto,
      flag: ProposalActionFlag
    ) => {
      if (!currentSession?.id || !content.id) return;
      try {
        await proposalService.actOnProposalContent(
          proposalId,
          content.id,
          flag
        );
        await fetchSessionProposals(currentSession.id);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail || "Failed to update proposal content";
        setError(errorMessage);
        setShowError(true);
      }
    },
    [currentSession?.id, fetchSessionProposals]
  );

  const sessionItems = useMemo<SessionItem[]>(() => {
    return sessions.map((session) => ({
      id: session.id,
      title: session.key,
      subtitle: new Date(session.created_at).toLocaleString(),
    }));
  }, [sessions]);

  const messagesPanel = (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: messages.length === 0 ? "center" : "flex-start",
        alignItems: "center",
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <Box
        sx={{
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          alignContent: "center",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          // height: "100%",
          scrollbarColor: "#6b6b6b transparent",
          scrollbarWidth: "auto",
          "&::-webkit-scrollbar": {
            width: "10px",
            height: "10px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#2b2b2b",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#6b6b6b",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#555",
          },
        }}
      >
        <Box sx={{ width: "60%" }}>
          {messages.length === 0 && !streamingId ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography color="text.secondary" variant="h4">
                {currentSession
                  ? "No messages in this session"
                  : "Select a session or start a new chat"}
              </Typography>
            </Box>
          ) : (
            <>
              {messages.map((message) => renderMessage(message))}
              {streamingId && streamingRole ? (
                <MessageBubble
                  key="streaming-message"
                  message={{
                    id: streamingId || "streaming",
                    role: streamingRole,
                    content: streamingContent,
                    created_at: new Date().toISOString(),
                  }}
                />
              ) : (
                connecting && (
                  <Skeleton
                    variant="text"
                    animation="wave"
                    width="100%"
                    height={40}
                    sx={{ mb: 2, borderRadius: 1 }}
                  />
                )
              )}

              <div ref={messagesEndRef} />
              <Box sx={{ height: 200 }} />
            </>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          width: "60%",
          mt: 2,
          ...(currentSession && messages.length > 0
            ? {
                zIndex: 10,
                position: "absolute",
                bottom: 16,
              }
            : {
                display: "flex",
                flexDirection: "column",
                // height: "100%",
                // // position: "relative",
                // backgroundColor: "transparent",
              }),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {(loadingProposals || sessionProposals.length > 0) && (
          <Accordion
            expanded={proposalExpanded}
            onChange={() => setProposalExpanded(!proposalExpanded)}
            sx={{
              width: "90%",
              marginX: "auto",
              "&.Mui-expanded": {
                marginY: "0",
                marginX: "auto",
              },
              // The optional fix for the line/shadow:

              borderRadius: 1,
              boxShadow: "none",
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <AccordionSummary expandIcon={<ExpandLess />}>
              <Typography variant="body1">
                Change Proposals ({sessionProposals.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {loadingProposals ? (
                <Skeleton
                  variant="rectangular"
                  height={120}
                  sx={{ borderRadius: 2 }}
                />
              ) : sessionProposals.length === 0 ? (
                <Typography color="text.secondary">
                  No proposals yet in this session.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {sessionProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      onProposalAction={handleProposalAction}
                      onProposalContentAction={handleProposalContentAction}
                    />
                  ))}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        )}
        <Paper
          elevation={4}
          sx={{
            p: 2,
            mt: 0,
            borderRadius: 2.5,
            flexShrink: 0,
            width: "100%",
          }}
        >
          <ChatSection
            sendMessage={handleSendMessage}
            disabled={connecting || !currentSession}
          />
        </Paper>
      </Box>

      <ErrorSnackbar
        open={showError}
        message={error}
        onClose={() => setShowError(false)}
      />
    </Box>
  );

  return (
    <WorkspaceShell
      connections={connections}
      selectedConnection={selectedConnection}
      onConnectionChange={onConnectionChange}
      projectOptions={{
        options: projectKeys,
        onChange: onProjectKeyChange,
        selectedOption: projectKey,
      }}
      storyOptions={{
        options: storyKeys,
        onChange: onStoryKeyChange,
        selectedOption: storyKey,
      }}
      submitAction={{
        label: "New Chat",
        onClick: handleNewChat,
      }}
      sessions={sessionItems}
      selectedSessionId={currentSession?.id}
      onSelectSession={handleSelectSession}
      loadingSessions={loadingSessions}
      loadingConnections={loadingConnections}
      emptyStateText="No chat sessions found"
      sessionListLabel="Chat Sessions"
      rightChildren={messagesPanel}
      headerText="Chat"
      headerProjectKey={currentSession?.project_key || ""}
      headerStoryKey={currentSession?.story_key || ""}
      appBarTransparent
    />
  );
};

export default ChatPageContent;
