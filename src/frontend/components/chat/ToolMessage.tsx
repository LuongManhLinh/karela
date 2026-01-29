"use client";

import React from "react";
import { CollapsibleMessage } from "./CollapsibleMessage";
import { Build } from "@mui/icons-material";
import { useTranslations } from "next-intl";
import type { ChatMessageDto } from "@/types/chat";

interface ToolMessageProps {
  message: ChatMessageDto;
}

export const ToolMessage: React.FC<ToolMessageProps> = ({ message }) => {
  const t = useTranslations("chat.ToolMessage");
  const content =
    typeof message.content === "string"
      ? message.content
      : JSON.stringify(message.content, null, 2);

  return (
    <CollapsibleMessage
      title={t("title")}
      content={content}
      icon={<Build />}
    />
  );
};
