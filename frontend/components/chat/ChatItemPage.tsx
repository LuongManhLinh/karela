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
import { AppSnackbar } from "@/components/AppSnackbar";
import type {
  ProposalDto,
  ProposalContentDto,
  ProposalActionFlag,
} from "@/types/proposal";
import type { ChatMessageDto, MessageRole, MessageChunk } from "@/types/chat";

import { ProposalCard } from "@/components/proposals/ProposalCard";

import { ChatSection } from "@/components/chat/ChatSection";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { useWebSocketContext } from "@/providers/WebSocketProvider";
import { useChatSessionQuery } from "@/hooks/queries/useChatQueries";
import { useSessionProposalsQuery } from "@/hooks/queries/useProposalQueries";

export interface ChatItemPageProps {
  connectionName: string;
  projectKey: string;
  storyKey?: string; // Required if level is "story"
  idOrKey: string;
}

const ChatItemPage: React.FC<ChatItemPageProps> = ({
  connectionName,
  projectKey,
  storyKey,
  idOrKey,
}) => {
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);

  // Separate streaming state - isolate active stream from history
  const streamingIdRef = useRef<string | null>(null);
  const streamingRoleRef = useRef<MessageRole | null>(null);

  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [streamingRole, setStreamingRole] = useState<MessageRole | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [bufferUpdateTrigger, setBufferUpdateTrigger] = useState(0);

  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [proposalExpanded, setProposalExpanded] = useState(true);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const streamingBufferRef = useRef<string>("");
  const animationFrameRef = useRef<number | null>(null);
  const displayedLengthRef = useRef<number>(0);
  const lastChunkTimeRef = useRef<number>(Date.now());
  const isCommittingRef = useRef<boolean>(false);

  const { data: sessionData, isLoading: loadingSession } = useChatSessionQuery(
    connectionName,
    projectKey,
    idOrKey,
  );

  const {
    data: sessionProposalsData,
    isLoading: loadingProposals,
    refetch: fetchSessionProposals,
  } = useSessionProposalsQuery(
    idOrKey,
    "CHAT",
    connectionName,
    projectKey,
    storyKey,
  );

  const [sessionProposals, setSessionProposals] = useState<ProposalDto[]>([]);

  useEffect(() => {
    setMessages(sessionData?.data?.messages || []);
  }, [sessionData]);

  useEffect(() => {
    setSessionProposals(sessionProposalsData?.data || []);
  }, [sessionProposalsData]);

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
          Math.max(3, Math.floor(100 / Math.max(timeSinceLastChunk, 10))),
        );

        const newLength = Math.min(
          buffer.length,
          currentDisplayed + charsPerFrame,
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
    [idOrKey],
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
        setWaitingForResponse(false); // First chunk arrived, stop waiting
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
    [commitStreamingMessage],
  );

  const { subscribe, unsubscribe, send, isConnected } = useWebSocketContext();

  const handleMessage = useCallback(
    (parsed: any) => {
      // console.log("Received chat message via subscription:", parsed);
      if (parsed.type === "message") {
        const chunkData = parsed.data as MessageChunk;
        handleMessageChunk(chunkData);
      } else if (parsed.type === "proposal" && parsed.data) {
        handleIncomingProposals(parsed.data);
      }
    },
    [handleMessageChunk, handleIncomingProposals],
  );

  const handleSendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim()) {
        return;
      }
      const messageToSend = userMessage.trim();

      // Commit any pending streaming message before adding new user message
      // This ensures correct message ordering
      if (streamingIdRef.current) {
        commitStreamingMessage();
      }

      // Add user message to UI immediately
      const userMsg: ChatMessageDto = {
        id: Date.now().toString(),
        role: "user",
        content: messageToSend,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      if (isConnected) {
        setWaitingForResponse(true); // Start waiting for AI response
        send({
          action: "chat_message",
          session_id_or_key: idOrKey,
          message: messageToSend,
        });
      } else {
        setError("Connection lost. Please try again.");
        setShowError(true);
      }
    },
    [isConnected, send, idOrKey, commitStreamingMessage],
  );

  useEffect(() => {
    if (!idOrKey) return;

    // Subscribe to chat topic
    const topic = `chat:${idOrKey}`;
    subscribe(topic, handleMessage);

    return () => {
      unsubscribe(topic, handleMessage);
    };
  }, [idOrKey, subscribe, unsubscribe, handleMessage]);

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
        await fetchSessionProposals();
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail || "Failed to update proposal";
        setError(errorMessage);
        setShowError(true);
      }
    },
    [idOrKey, fetchSessionProposals],
  );

  const handleProposalContentAction = useCallback(
    async (
      proposalId: string,
      content: ProposalContentDto,
      flag: ProposalActionFlag,
    ) => {
      try {
        await proposalService.actOnProposalContent(
          proposalId,
          content.id,
          flag,
        );
        await fetchSessionProposals();
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail || "Failed to update proposal content";
        setError(errorMessage);
        setShowError(true);
      }
    },
    [idOrKey, fetchSessionProposals],
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
                waitingForResponse && (
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

        <ChatSection sendMessage={handleSendMessage} disabled={!isConnected} />
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

      <AppSnackbar
        open={showError}
        message={error}
        onClose={() => setShowError(false)}
      />
    </Box>
  );
};

export default ChatItemPage;
