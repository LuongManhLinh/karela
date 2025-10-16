import { Box, xcss } from "@atlaskit/primitives";
import Button from "@atlaskit/button";
import type { ThemePreference } from "../theme";

type Props = {
  value: ThemePreference;
  onChange: (v: ThemePreference) => void;
};

const containerStyles = xcss({
  marginTop: "space.200",
  padding: "space.100",
  borderRadius: "border.radius.200",
  backgroundColor: "color.background.neutral",
  borderColor: "color.border",
  borderStyle: "solid",
  borderWidth: "border.width",
});

const labelStyles = xcss({
  fontSize: "12px",
  color: "color.text.subtlest",
  marginBottom: "space.050",
  display: "block",
});

const buttonGroupStyles = xcss({
  display: "flex",
  gap: "space.050",
  backgroundColor: "color.background.input",
  padding: "space.025",
  borderRadius: "border.radius.100",
});

export default function ThemeSelector({ value, onChange }: Props) {
  const buttons: Array<{ val: ThemePreference; label: string; icon: string }> =
    [
      { val: "system", label: "System", icon: "💻" },
      { val: "light", label: "Light", icon: "☀️" },
      { val: "dark", label: "Dark", icon: "🌙" },
    ];

  return (
    <Box xcss={containerStyles}>
      <Box xcss={labelStyles}>Appearance</Box>
      <Box xcss={buttonGroupStyles}>
        {buttons.map((btn) => (
          <Button
            key={btn.val}
            appearance={value === btn.val ? "primary" : "subtle"}
            onClick={() => onChange(btn.val)}
            style={{ flex: 1 }}
          >
            {btn.icon}
          </Button>
        ))}
      </Box>
    </Box>
  );
}
