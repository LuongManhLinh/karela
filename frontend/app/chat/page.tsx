"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { Send, ExpandMore } from "@mui/icons-material";
import { Layout } from "@/components/Layout";
import { SessionStartForm } from "@/components/SessionStartForm";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ErrorMessage } from "@/components/chat/ErrorMessage";
import { FunctionCallMessage } from "@/components/chat/FunctionCallMessage";
import { ToolMessage } from "@/components/chat/ToolMessage";
import { AnalysisProgressMessage } from "@/components/chat/AnalysisProgressMessage";
import { ProposalDisplay } from "@/components/chat/ProposalDisplay";
import { chatService } from "@/services/chatService";
import { ErrorSnackbar } from "@/components/ErrorSnackbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import type {
  ChatSessionSummary,
  ChatSessionDto,
  ChatMessageDto,
  MessageRole,
  MessageChunk,
} from "@/types";

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000/api/v1/chat/";

export default function ChatPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSessionDto | null>(
    null
  );
  const [connectionId, setConnectionId] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [storyKey, setStoryKey] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);

  // Separate streaming state - isolate active stream from history
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingRole, setStreamingRole] = useState<MessageRole | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [proposalExpanded, setProposalExpanded] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const response = await chatService.getChatSession(sessionId);
      if (response.data) {
        setCurrentSession(response.data);
        setProjectKey(response.data.project_key);
        setMessages(response.data.messages || []);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to load session";
      setError(errorMessage);
      setShowError(true);
    }
  }, []);

  const handleStartSession = async (data: {
    connectionId: string;
    projectKey: string;
    storyKey?: string;
  }) => {
    setConnectionId(data.connectionId);
    setProjectKey(data.projectKey);
    setStoryKey(data.storyKey || "");
    setCurrentSession(null);
    setMessages([]);
    await loadSessions(data.connectionId);
  };

  const handleSelectConnection = async (connId: string) => {
    setConnectionId(connId);
    setCurrentSession(null);
    setMessages([]);
    await loadSessions(connId);
  };

  const handleSelectSession = async (sessionId: string) => {
    await loadSession(sessionId);
  };

  const connectWebSocket = (
    connId: string,
    projKey: string,
    userMessage: string,
    storyKey?: string,
    sessionId?: string
  ) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found");
      setShowError(true);
      return;
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
          story_key: storyKey || null,
          session_id: sessionId || null,
        };

        // Include user message if provided (backend may not use it yet)
        initMessage.user_message = userMessage;

        ws.send(JSON.stringify(initMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "session_id") {
            // Session created
            const newSessionId = data.data;
            if (newSessionId && !sessionId) {
              setCurrentSession(
                (prev) =>
                  ({
                    ...prev!,
                    id: newSessionId,
                  } as ChatSessionDto)
              );
              loadSessions(connId);
              loadSession(newSessionId);
            }
          } else if (data.type === "message") {
            // Handle streaming message chunks
            handleMessageChunk(data.data);
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
      };

      ws.onclose = () => {
        setConnecting(false);

        // Commit any active streaming message before closing
        commitStreamingMessage();

        wsRef.current = null;
        // Reload session to get persisted messages
        if (currentSession?.id) {
          loadSession(currentSession.id);
        }
      };
    } catch (err) {
      console.log("Error connecting to chat server:", err);
      setError((err as Error).message || "Failed to connect to chat server");
      setShowError(true);
      setConnecting(false);
    }
  };

  const handleMessageChunk = (chunk: MessageChunk) => {
    const chunkId = chunk.id;
    const chunkRole = (chunk.role || "agent") as MessageRole;

    // Check if this is a new message stream
    if (!isStreaming || streamingId !== chunkId) {
      // Start new stream
      setIsStreaming(true);
      setStreamingId(chunkId);
      setStreamingRole(chunkRole);
      setStreamingContent(chunk.content || "");
    } else {
      // Continue existing stream - lightweight update
      setStreamingContent((prev) => prev + (chunk.content || ""));
    }
  };

  // Commit streaming message to history when stream ends
  const commitStreamingMessage = useCallback(() => {
    if (isStreaming && streamingId && streamingRole) {
      setMessages((prev) => [
        ...prev,
        {
          id: streamingId,
          role: streamingRole,
          content: streamingContent,
          created_at: new Date().toISOString(),
        },
      ]);

      // Reset streaming state
      setIsStreaming(false);
      setStreamingContent("");
      setStreamingRole(null);
      setStreamingId(null);
    }
  }, [isStreaming, streamingId, streamingRole, streamingContent]);

  const handleSendMessage = async () => {
    console.log("Sending message:", userMessage);
    console.log("Current session ID:", currentSession?.id);
    console.log("Connection ID:", connectionId);
    console.log("Project Key:", projectKey);
    console.log("Story Key:", storyKey);
    if (!userMessage.trim() || !connectionId || !projectKey) {
      return;
    }

    const messageToSend = userMessage.trim();
    setUserMessage("");

    // Add user message to UI immediately
    const userMsg: ChatMessageDto = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    connectWebSocket(
      connectionId,
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

  const handleUpdateSession = async () => {
    if (currentSession?.id) {
      await loadSession(currentSession.id);
      if (connectionId) {
        await loadSessions(connectionId);
      }
    }
  };

  return (
    <Layout>
      <Box sx={{ display: "flex", height: "calc(100vh - 64px)" }}>
        {/* Left Sidebar - Session List */}
        <Paper
          elevation={2}
          sx={{
            width: "300px",
            height: "100%",
            overflow: "auto",
            borderRadius: 0,
            borderTopRightRadius: 3,
            borderBottomRightRadius: 3,
            bgcolor: "background.paper",
            boxShadow: "2px 0 8px rgba(0, 0, 0, 0.08)",
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Chat Sessions
            </Typography>
            <SessionStartForm
              onSubmit={handleStartSession}
              onConnectionChange={handleSelectConnection}
              loading={loading}
              submitLabel="New Chat"
              showMessageField={false}
            />
            <Divider sx={{ my: 2 }} />
            {loadingSessions ? (
              <LoadingSpinner />
            ) : (
              <List>
                {sessions.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No chat sessions found" />
                  </ListItem>
                ) : (
                  sessions.map((session) => (
                    <ListItem key={session.id} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => handleSelectSession(session.id)}
                        selected={currentSession?.id === session.id}
                        sx={{
                          borderRadius: 1,
                          "&.Mui-selected": {
                            bgcolor: "primary.main",
                            color: "white",
                            "&:hover": {
                              bgcolor: "primary.dark",
                            },
                          },
                          "&:hover": {
                            bgcolor: "action.hover",
                          },
                          paddingY: 0.5,
                          paddingX: 2,
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" noWrap>
                              {session.project_key}
                              {session.story_key && ` - ${session.story_key}`}
                            </Typography>
                          }
                          secondary={
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(session.created_at).toLocaleString()}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))
                )}
              </List>
            )}
          </Box>
        </Paper>

        {/* Main Chat Area */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Chat Messages */}
          <Box
            sx={{
              flexGrow: 1,
              overflow: "auto",
              p: 2,
              bgcolor: "background.default",
              width: "60%",
              "&::-webkit-scrollbar": {
                display: "none",
              },
              scrollbarWidth: "none", // equivalent to 'scrollbar-width: none;'

              // 4. **For IE and older Edge**
              msOverflowStyle: "none", // equivalent to '-ms-overflow-style: none;'
            }}
          >
            {messages.length === 0 && !isStreaming ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Typography color="text.secondary">
                  {currentSession
                    ? "No messages in this session"
                    : "Select a session or start a new chat or send a message to begin"}
                </Typography>
              </Box>
            ) : (
              <>
                {/* Render Message History */}
                {messages.map((message) => renderMessage(message))}

                {/* Render Active Stream Separately */}
                {isStreaming && streamingRole && (
                  <MessageBubble
                    key="streaming-message"
                    message={{
                      id: streamingId || "streaming",
                      role: streamingRole,
                      content: streamingContent,
                      created_at: new Date().toISOString(),
                    }}
                  />
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </Box>

          {/* Proposal Display (if exists) */}
          {currentSession &&
            currentSession.change_proposals &&
            currentSession.change_proposals.length > 0 && (
              <Box sx={{ p: 2, bgcolor: "background.paper" }}>
                <Accordion
                  expanded={proposalExpanded}
                  onChange={() => setProposalExpanded(!proposalExpanded)}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">
                      Change Proposals ({currentSession.change_proposals.length}
                      )
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      {currentSession.change_proposals.map((proposal) => (
                        <ProposalDisplay
                          key={proposal.id}
                          proposal={proposal}
                          sessionId={currentSession.id}
                          onUpdate={handleUpdateSession}
                        />
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}

          {/* Message Input */}
          <Paper
            elevation={4}
            sx={{
              p: 2,
              borderRadius: 2,
              width: "60%",
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 1, // 1. Firefox Support (Standard CSS)
                // Syntax: <thumb-color> <track-color>
                scrollbarColor: "#6b6b6b transparent",
                scrollbarWidth: "thin",

                // 2. Webkit Support (Chrome, Safari, Edge)
                "&::-webkit-scrollbar": {
                  width: "10px", // Width for vertical scrollbar
                  height: "10px", // Height for horizontal scrollbar
                },

                // The Background (Track)
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "#2b2b2b",
                  borderRadius: "4px",
                },

                // The Scroller (Thumb)
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#6b6b6b",
                  borderRadius: "4px",
                },

                // Hover state for the Scroller
                "&::-webkit-scrollbar-thumb:hover": {
                  backgroundColor: "#555",
                },
              }}
            >
              <TextField
                variant="outlined"
                fullWidth
                multiline
                maxRows={12}
                placeholder={
                  currentSession
                    ? "Type your message..."
                    : "Start a session first by selecting one from the sidebar or creating a new chat"
                }
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={connecting || (!currentSession && !connectionId)}
                sx={{
                  "& fieldset": { border: "none" },
                }}
                InputProps={{
                  disableUnderline: true, // 2. Remove the bottom border
                  style: {
                    paddingBottom: 0,
                    paddingTop: 8,
                  },
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={
                  !userMessage.trim() ||
                  connecting ||
                  (!currentSession && !connectionId)
                }
              >
                <Send />
              </IconButton>
            </Box>
            {connecting && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Connecting to chat server...
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
      <ErrorSnackbar
        open={showError}
        message={error}
        onClose={() => setShowError(false)}
      />
    </Layout>
  );
}
