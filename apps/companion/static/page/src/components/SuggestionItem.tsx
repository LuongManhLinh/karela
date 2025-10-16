import { Box, xcss } from "@atlaskit/primitives";
import { Checkbox } from "@atlaskit/checkbox";

type Props = {
  id: string;
  text: string;
  done: boolean;
  disabled?: boolean;
  onToggle: (id: string) => void;
};

const containerStyles = xcss({
  display: "flex",
  alignItems: "flex-start",
  marginBottom: "space.100",
});

// const labelStyles = xcss({
//   color: "color.text",
//   fontSize: "14px",
//   marginLeft: "space.100",
// });

export default function SuggestionItem({
  id,
  text,
  done,
  disabled,
  onToggle,
}: Props) {
  return (
    <Box xcss={containerStyles}>
      <Checkbox
        isChecked={done}
        onChange={() => onToggle(id)}
        isDisabled={disabled}
        label={text}
      />
    </Box>
  );
}
