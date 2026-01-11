"use client";

import { Box, Paper, Typography } from "@mui/material";

import { chatService } from "@/services/chatService";
import { useRouter } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";

import { CHAT_KEYS } from "@/hooks/queries/useChatQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { ChatSection } from "@/components/chat/ChatSection";
import { useWaitingMessageStore } from "@/store/useWaitingMessageStore";
import { ErrorSnackbar } from "@/components/ErrorSnackbar";
import { useState } from "react";
import { scrollBarSx } from "@/constants/scrollBarSx";

const ChatDetailPage: React.FC = () => {
  const { selectedConnectionId, selectedProjectKey, selectedStoryKey } =
    useWorkspaceStore();

  const { setWaitingMessage } = useWaitingMessageStore();

  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  const queryClient = useQueryClient();
  const router = useRouter();

  const handleSendMessage = async (userMessage: string) => {
    const message = userMessage.trim();
    if (!message || !selectedConnectionId || !selectedProjectKey) {
      return;
    }

    const createSessionResp = await chatService.createChatSession({
      connection_id: selectedConnectionId,
      project_key: selectedProjectKey,
      story_key:
        selectedStoryKey && selectedStoryKey !== "none"
          ? selectedStoryKey
          : undefined,
    });
    const sessionId = createSessionResp.data;
    if (sessionId) {
      queryClient.invalidateQueries({
        queryKey: CHAT_KEYS.sessions(selectedConnectionId),
      });

      setWaitingMessage(sessionId, message);

      router.push(`/chat/${sessionId}`);
    } else {
      setError("Failed to create chat session");
      setShowError(true);
    }
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
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
          justifyContent: "flex-start",
          width: "100%",
          // height: "100%",
          ...scrollBarSx,
        }}
      >
        <Box sx={{ width: "60%" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography color="text.secondary" variant="h4">
              Enter a message to start the chat
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          width: "60%",
          mt: 2,

          display: "flex",
          flexDirection: "column",
          // height: "100%",
          // // position: "relative",
          // backgroundColor: "transparent",

          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ChatSection sendMessage={handleSendMessage} disabled={false} />
      </Box>
      <ErrorSnackbar
        open={showError}
        message={error}
        onClose={() => setShowError(false)}
      />
    </Box>
  );
};

export default ChatDetailPage;
