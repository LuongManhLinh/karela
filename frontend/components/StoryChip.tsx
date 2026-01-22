"use client";

import React, { useState } from "react";
import BookmarkBorderTwoToneIcon from "@mui/icons-material/BookmarkBorderTwoTone";
import { Chip } from "@mui/material";
import StoryDetailDialog from "./StoryDialog";

interface StoryChipProps {
  storyKey: string;
  size?: "small" | "medium";
  clickable?: boolean;
  onClick?: () => void;
}

const StoryChip: React.FC<StoryChipProps> = ({
  storyKey,
  size = "small",
  clickable = true,
  onClick,
}) => {
  return (
    <Chip
      label={storyKey}
      icon={<BookmarkBorderTwoToneIcon color="success" />}
      size={size}
      onClick={clickable ? onClick : undefined}
      sx={clickable ? { cursor: "pointer" } : undefined}
    />
  );
};

export default StoryChip;
