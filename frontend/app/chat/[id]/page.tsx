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
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import { ExpandLess } from "@mui/icons-material";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ErrorMessage } from "@/components/chat/ErrorMessage";
import { FunctionCallMessage } from "@/components/chat/FunctionCallMessage";
import { ToolMessage } from "@/components/chat/ToolMessage";
import { AnalysisProgressMessage } from "@/components/chat/AnalysisProgressMessage";
import { chatService } from "@/services/chatService";
import { proposalService } from "@/services/proposalService";
import { ErrorSnackbar } from "@/components/ErrorSnackbar";
import type {
  ProposalDto,
  ProposalContentDto,
  ProposalActionFlag,
} from "@/types/proposal";
import type { ChatMessageDto, MessageRole, MessageChunk } from "@/types/chat";

import { ProposalCard } from "@/components/proposals/ProposalCard";

import { getToken } from "@/utils/jwtUtils";
import { ChatSection } from "@/components/chat/ChatSection";
import { useParams } from "next/navigation";
import { useWaitingMessageStore } from "@/store/useWaitingMessageStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { load } from "ace-builds/src-noconflict/ext-emmet";

const WS_BASE_URL = "ws://localhost:8000/api/v1/chat/";

const ChatDetailPage: React.FC = () => {
  const { id } = useParams();
  const idOrKey = useMemo(() => {
    return typeof id === "string" ? id : null;
  }, [id]);

  if (!idOrKey) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <Typography color="text.secondary" variant="h4">
          No session selected
        </Typography>
      </Box>
    );
  }

  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [sessionProposals, setSessionProposals] = useState<ProposalDto[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  // Separate streaming state - isolate active stream from history
  const streamingIdRef = useRef<string | null>(null);
  const streamingRoleRef = useRef<MessageRole | null>(null);

  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [streamingRole, setStreamingRole] = useState<MessageRole | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [bufferUpdateTrigger, setBufferUpdateTrigger] = useState(0);

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

  const {
    sessionId: waitingSessionId,
    message: waitingMessage,
    resetWaitingMessage,
  } = useWaitingMessageStore();

  const initialzed = useRef<boolean>(false);

  const loadSession = useCallback(
    async (sessionKey: string) => {
      try {
        setLoadingSession(true);
        const response = await chatService.getChatSession(sessionKey);
        setMessages(response.data?.messages || []);
        await fetchSessionProposals(sessionKey);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail || "Failed to load session";
        setError(errorMessage);
        setShowError(true);
      } finally {
        setLoadingSession(false);
      }
    },
    [idOrKey]
  );

  useEffect(() => {
    if (idOrKey && !initialzed.current) {
      if (idOrKey === waitingSessionId && waitingMessage) {
        console.log("Sending waiting message for session:", idOrKey);
        const messageToSend = waitingMessage.trim();
        resetWaitingMessage();
        handleSendMessage(messageToSend);
      } else {
        loadSession(idOrKey);
      }
      initialzed.current = true;
    }
  }, []);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleIncomingProposals = useCallback(
    async (proposalIds: string[]) => {
      try {
        const fetchedProposals: ProposalDto[] = [];
        for (const proposalId of proposalIds) {
          const response = await proposalService.getProposal(proposalId);
          const proposal = response.data;
          if (!proposal) {
            continue;
          }
          if (proposal.session_id !== idOrKey) {
            continue;
          }
          fetchedProposals.push(proposal);
        }
        setSessionProposals((prev) => [...prev, ...fetchedProposals]);
      } catch (err) {
        console.error("Failed to fetch proposal:", err);
      }
    },
    [idOrKey]
  );

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
    }
  }, [streamingIdRef, streamingRoleRef]);

  const handleMessageChunk = useCallback(
    (chunk: MessageChunk) => {
      const chunkId = chunk.id;
      const chunkRole = (chunk.role || "agent") as MessageRole;
      const chunkContent = chunk.content || "";

      // Check if this is a NEW message (different ID from current streaming message)
      if (streamingIdRef.current && streamingIdRef.current !== chunkId) {
        commitStreamingMessage();
      }

      if (!streamingIdRef.current || streamingIdRef.current !== chunkId) {
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
    (userMessage: string, sessionId: string) => {
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
            session_id: sessionId,
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
            } else if (parsed.type === "proposal" && parsed.data) {
              handleIncomingProposals(parsed.data);
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
      idOrKey,
      handleMessageChunk,
      commitStreamingMessage,
      fetchSessionProposals,
      handleIncomingProposals,
    ]
  );

  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) {
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

    connectWebSocket(messageToSend, idOrKey);
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
      try {
        await proposalService.actOnProposal(proposalId, flag);
        await fetchSessionProposals(idOrKey);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail || "Failed to update proposal";
        setError(errorMessage);
        setShowError(true);
      }
    },
    [idOrKey, fetchSessionProposals]
  );

  const handleProposalContentAction = useCallback(
    async (
      proposalId: string,
      content: ProposalContentDto,
      flag: ProposalActionFlag
    ) => {
      try {
        await proposalService.actOnProposalContent(
          proposalId,
          content.id,
          flag
        );
        await fetchSessionProposals(idOrKey);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail || "Failed to update proposal content";
        setError(errorMessage);
        setShowError(true);
      }
    },
    [idOrKey, fetchSessionProposals]
  );

  const chatContent = (
    <>
      <Box
        sx={{
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          alignContent: "center",
          alignItems: "center",
          justifyContent: "flex-start",
          width: "100%",
          // height: "100%",
          ...scrollBarSx,
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
                No messages in this session
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
          ...(messages.length > 0
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
            square={false}
            expanded={proposalExpanded}
            onChange={() => setProposalExpanded(!proposalExpanded)}
            sx={{
              width: "90%",

              marginX: "auto",
              overflow: "hidden",
              "&.Mui-expanded": {
                marginY: "0",
                marginX: "auto",
                // borderRadius: 0,
                // borderTopLeftRadius: 1,
                // borderTopRightRadius: 1,
              },

              // borderRadius: 0,
              // The optional fix for the line/shadow:

              // borderTopLeftRadius: 1,
              // borderTopRightRadius: 1,
              "&:before": {
                display: "none", // Hides the default MUI divider line
              },
              boxShadow: "none",
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandLess />}
              // sx={{ borderRadius: 0 }}
            >
              <Typography variant="body1">
                Proposals ({sessionProposals.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                maxHeight: 600,
                overflowY: "auto",
                ...scrollBarSx,
              }}
            >
              {loadingProposals ? (
                <Skeleton
                  variant="rectangular"
                  height={120}
                  sx={{ borderRadius: 1 }}
                />
              ) : sessionProposals.length === 0 ? (
                <Typography color="text.secondary">
                  No proposals yet in this session.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    bgcolor: "transparent",
                  }}
                >
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

        <ChatSection sendMessage={handleSendMessage} disabled={connecting} />
      </Box>
    </>
  );

  return (
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
      {loadingSession ? <CircularProgress /> : chatContent}

      <ErrorSnackbar
        open={showError}
        message={error}
        onClose={() => setShowError(false)}
      />
    </Box>
  );
};

export default ChatDetailPage;
