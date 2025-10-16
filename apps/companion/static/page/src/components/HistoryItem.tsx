import { Box, xcss } from "@atlaskit/primitives";
import dayjs from "dayjs";

type Props = {
  id: string;
  title: string;
  timestamp: string;
  selected?: boolean;
  onClick?: () => void;
};

const itemStyles = xcss({
  padding: "space.150",
  borderRadius: "border.radius.100",
  cursor: "pointer",
  marginBottom: "space.100",
});

const selectedStyles = xcss({
  backgroundColor: "color.background.selected",
});

const titleStyles = xcss({
  color: "color.text",
  fontSize: "14px",
  fontWeight: "500",
});

const timeStyles = xcss({
  color: "color.text.subtlest",
  fontSize: "12px",
  marginTop: "space.050",
});

export default function HistoryItem({
  id,
  title,
  timestamp,
  selected,
  onClick,
}: Props) {
  return (
    <Box
      id={id}
      as="div"
      xcss={[itemStyles, selected && selectedStyles]}
      onClick={onClick}
    >
      <Box xcss={titleStyles}>{title}</Box>
      <Box xcss={timeStyles}>{dayjs(timestamp).format("HH:mm")}</Box>
    </Box>
  );
}
