import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

import { ChatSection } from "@/components/chat/ChatSection";

import { scrollBarSx } from "@/constants/scrollBarSx";

const ChatPage: React.FC = () => {
  const t = useTranslations("chat.ChatPage");
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
              {t("gettingStarted")}
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
