"use client";
import { Box, Typography } from "@mui/material";

import { ChatSection } from "@/components/chat/ChatSection";

import { scrollBarSx } from "@/constants/scrollBarSx";

const ChatPage: React.FC = () => {
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
              Select or create a chat session to get started.
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
        <ChatSection sendMessage={() => {}} disabled={true} />
      </Box>
    </Box>
  );
};

export default ChatPage;
