"use client";

import React from "react";
import { CollapsibleMessage } from "./CollapsibleMessage";
import { Functions } from "@mui/icons-material";
import type { ChatMessageDto } from "@/types/chat";

interface FunctionCallMessageProps {
  message: ChatMessageDto;
}

export const FunctionCallMessage: React.FC<FunctionCallMessageProps> = ({
  message,
}) => {
  let content: any;

  try {
    if (typeof message.content === "string") {
      content = JSON.parse(message.content);
    } else {
      content = message.content;
    }
  } catch (e) {
    // If parsing fails, use the string as-is
    content = message.content;
  }

  return (
    <CollapsibleMessage
      title="Function Call"
      content={content}
      icon={<Functions />}
    />
  );
};
