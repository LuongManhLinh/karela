import BookmarkBorderTwoToneIcon from "@mui/icons-material/BookmarkBorderTwoTone";
import { Chip } from "@mui/material";

interface StoryChipProps {
  storyKey: string;
  size?: "small" | "medium";
}
const StoryChip: React.FC<StoryChipProps> = ({ storyKey, size = "small" }) => {
  return (
    <Chip
      label={storyKey}
      icon={<BookmarkBorderTwoToneIcon color="success" />}
      size={size}
    />
  );
};

export default StoryChip;
