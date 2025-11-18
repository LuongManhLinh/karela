"use client";

import React from "react";
import { CollapsibleMessage } from "./CollapsibleMessage";
import { Build } from "@mui/icons-material";
import type { ChatMessageDto } from "@/types";

interface ToolMessageProps {
  message: ChatMessageDto;
}

export const ToolMessage: React.FC<ToolMessageProps> = ({ message }) => {
  const content =
    typeof message.content === "string"
      ? message.content
      : JSON.stringify(message.content, null, 2);

  return (
    <CollapsibleMessage
      title="Tool Output"
      content={content}
      icon={<Build />}
    />
  );
}

