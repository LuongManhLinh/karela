import {
  Box,
  Icon,
  IconButton,
  InputAdornment,
  Popover,
  TextField,
  Typography,
} from "@mui/material";
import { Send as SendIcon, Close as CloseIcon } from "@mui/icons-material";
import React, { useState } from "react";

export interface ACChatPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  anchorOrigin?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "right" | "center";
  };
  transformOrigin?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "right" | "center";
  };
  title?: string;
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const MemorizedTextField = React.memo(TextField);

export const ACChatPopover: React.FC<ACChatPopoverProps> = ({
  open,
  anchorEl,
  onClose,
  anchorOrigin,
  transformOrigin,
  title,
  onSendMessage,
  disabled = false,
}) => {
  const [message, setMessage] = useState("");
  const handleSendMessage = (message: string) => {
    onSendMessage(message);
    setMessage("");
  };
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      // This allows the user to click and select text behind the Popover
      hideBackdrop={true}
      // This prevents the Popover from "trapping" the keyboard focus
      disableEnforceFocus={true}
      // This allows the user to scroll the page while the popover is open
      disableScrollLock={true}
      slotProps={{
        root: {
          sx: { pointerEvents: "none" },
        },
        paper: {
          sx: {
            p: 1,
            borderRadius: 1,
            minWidth: 200,
            maxWidth: 700,
            width: "50vw",
            pointerEvents: "auto",
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
        }}
      >
        <Typography sx={{ fontWeight: "bold" }}>
          {title || "Feedback"}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <MemorizedTextField
        variant="outlined"
        fullWidth
        multiline
        maxRows={8}
        placeholder={"Type your feedback..."}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            handleSendMessage(message);
          }
        }}
        disabled={disabled}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => handleSendMessage(message)}>
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    </Popover>
  );
};
