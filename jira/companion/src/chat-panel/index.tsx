import React, { useEffect, useMemo, useRef, useState } from "react";
import ForgeReconciler, {
  Box,
  Heading,
  Inline,
  LoadingButton,
  Spinner,
  Stack,
  Tag,
  Text,
  TextArea,
  Icon,
  xcss,
} from "@forge/react";
import { ChatMessageDto, ChatSessionDto } from "./types/chats";
import { MockChatService as ChatService } from "./services/chatService";
import { MessageBubble, AgentMessage } from "./components/Messages";
import ProposalSection from "./components/ProposalSection";

export const ChatPanel = ({ style }: { style?: "panel" | "page" }) => {
  const [session, setSession] = useState<ChatSessionDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  // const [typing, setTyping] = useState(false);
  const [latestMessageId, setLatestMessageId] = useState<number>(0);
  const [polling, setPolling] = useState<boolean>(false);

  useEffect(() => {
    // On mount, try to load existing chat session
    ChatService.getChatSessionByProjectAndStory().then((res) => {
      if (res.data) {
        console.log("Loaded existing chat session", res.data);
        setSession(res.data);
        setMessages(res.data.messages || []);
        const maxId = res.data.messages
          ? Math.max(...res.data.messages.map((m) => m.id))
          : 0;
        setLatestMessageId(maxId);
      } else {
        console.log("No existing chat session found, please start a new one.");
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (polling) {
        pollForUpdates();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [polling]);

  const pollForUpdates = () => {
    if (!session) return;
    console.log("Polling for updates...");
    setPolling(false);
    ChatService.getLatestAfter(session.id, latestMessageId).then((res) => {
      if (res.data && res.data.length > 0) {
        setMessages((prev) => [...prev, ...res.data!]);
        const maxId = Math.max(...res.data!.map((m) => m.id));
        setLatestMessageId(maxId);
      } else {
        setPolling(true);
      }
    });
  };

  const onSend = async () => {
    const message = input.trim();
    if (!message) return;
    setSending(true);
    setPolling(false);
    try {
      if (session) {
        console.log("Posting message", message, "to session", session);
        const result = await ChatService.postMessage(session.id, message);
        if (!result.data) {
          setSending(false);
          return;
        }

        const data = result.data!;
        setMessages((prev) => [
          ...prev,
          {
            id: data.message_id,
            content: message,
            role: "user",
            created_at: data.message_created_at,
          } as ChatMessageDto,
        ]);
        setLatestMessageId(data.message_id);
        setInput("");
      } else {
        console.log("Creating chat session with message", input.trim());
        // No session yet, create one
        const result = await ChatService.createChatSession(input.trim());
        if (result.errors || !result.data) {
          console.log("Error creating chat session", result.errors);
          setSending(false);
          return;
        }

        setMessages(result.data.messages);
        setSession(result.data);
        setLatestMessageId(result.data.messages[0].id);
        console.log("Created chat session", result.data);
        setInput("");
      }
    } finally {
      setPolling(true);
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Box
        xcss={{
          padding: "space.400",
          minHeight: "300px",
        }}
      >
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <Box
      xcss={{
        maxHeight: "680px",
        width: "100%",
        padding: "space.050",
      }}
    >
      <Stack grow="fill" spread="space-between">
        <Box
          xcss={{
            padding: "space.200",
            overflow: "auto",
            maxHeight: "550px",
            paddingBottom: "space.1000",
          }}
        >
          <Stack space="space.150">
            {messages.map((m) =>
              m.role === "ai" ? (
                <AgentMessage key={m.id} message={m.content} />
              ) : (
                <MessageBubble key={m.id} message={m} />
              )
            )}
          </Stack>
        </Box>
        <Stack>
          {session && session.change_proposals.length > 0 && (
            <Box xcss={{ paddingRight: "space.800" }}>
              <ProposalSection proposals={session.change_proposals} />
            </Box>
          )}
          <Inline
            alignInline="end"
            spread="space-between"
            alignBlock="center"
            space="space.050"
          >
            <TextArea
              value={input}
              onChange={(e) => {
                // If e is ENTER key, log to console
                setInput(e.target.value);
              }}
              placeholder="Type your message..."
            />

            <LoadingButton
              appearance="primary"
              isLoading={sending}
              onClick={onSend}
              isDisabled={!input.trim()}
            >
              {sending ? "Sending..." : "Send"}
            </LoadingButton>
          </Inline>
        </Stack>
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <ChatPanel />
  </React.StrictMode>
);
