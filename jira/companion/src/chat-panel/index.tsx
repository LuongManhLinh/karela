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
} from "@forge/react";
import { ChatMessageDto } from "./types";
import { ChatService } from "./chatService";
import { MessageBubble } from "./components";

const ChatPanel = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  // const [loading, setLoading] = useState(true);
  // const [typing, setTyping] = useState(false);
  const [lastFetchedId, setLastFetchedId] = useState<number>(0);
  const [polling, setPolling] = useState<boolean>(false);

  useEffect(() => {
    // On mount, try to load existing chat session
    ChatService.getChatSessionByProjectAndStory().then((res) => {
      if (res.data) {
        console.log("Loaded existing chat session", res.data);
        setSessionId(res.data.id);
        setMessages(res.data.messages || []);
        const maxId = res.data.messages
          ? Math.max(...res.data.messages.map((m) => m.id))
          : 0;
        setLastFetchedId(maxId);
      } else {
        console.log("No existing chat session found, please start a new one.");
      }
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (polling) {
        pollForUpdates();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [polling]);

  const pollForUpdates = () => {
    if (!sessionId) return;
    console.log("Polling for updates...");
    setPolling(false);
    ChatService.getLatestAfter(sessionId, lastFetchedId).then((res) => {
      if (res.data && res.data.length > 0) {
        setMessages((prev) => [...prev, ...res.data!]);
        const maxId = Math.max(...res.data!.map((m) => m.id));
        setLastFetchedId(maxId);
      } else {
        setPolling(true);
      }
    });
  };

  const onSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      if (sessionId) {
        console.log("Posting message", input.trim(), "to session", sessionId);
        const result = await ChatService.postMessage(sessionId, input.trim());
        if (result.errors) {
          setSending(false);
          return;
        }
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

        setSessionId(result.data);
        console.log("Created chat session", result.data);
        setInput("");
      }
      setPolling(true);
    } finally {
      setSending(false);
    }
  };

  // if (loading) {
  //   return (
  //     <Box
  //       xcss={{
  //         padding: "space.400",
  //         minHeight: "300px",
  //       }}
  //     >
  //       <Spinner size="large" />
  //     </Box>
  //   );
  // }

  return (
    <Stack space="space.200">
      <Box
        xcss={{
          borderWidth: "border.width",
          borderStyle: "solid",
          borderColor: "color.border",
          borderRadius: "border.radius",
          padding: "space.200",
          backgroundColor: "elevation.surface.raised",
          overflowY: "auto",
          maxHeight: "420px",
        }}
      >
        <Stack space="space.150">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </Stack>
      </Box>

      <Inline
        alignInline="end"
        spread="space-between"
        alignBlock="center"
        space="space.050"
      >
        <TextArea
          value={input}
          onChange={(e) => {
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
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <ChatPanel />
  </React.StrictMode>
);
