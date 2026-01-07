import { Box, IconButton, TextField, Paper } from "@mui/material";
import React, { useState, useRef } from "react";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

const MemoizedTextField = React.memo(TextField);

export const ChatSection: React.FC<{
  sendMessage: (message: string) => void;
  disabled: boolean;
  sx?: React.CSSProperties;
}> = ({ sendMessage, disabled, sx }) => {
  const [userMessage, setUserMessage] = useState("");
  const textFieldRef = useRef<HTMLInputElement>(null);

  const handleFocusTextField = () => {
    textFieldRef.current?.focus();
  };

  return (
    <Paper
      elevation={2}
      onClick={handleFocusTextField}
      sx={{
        cursor: "text",
        p: 2,
        mt: 0,
        borderRadius: 2.5,
        flexShrink: 0,
        width: "100%",
      }}
    >
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
          ...sx,
        }}
      >
        <MemoizedTextField
          inputRef={textFieldRef}
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
    </Paper>
  );
};
