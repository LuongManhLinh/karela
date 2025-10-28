import React from "react";
import {
  Box,
  Button,
  Checkbox,
  Heading,
  Inline,
  Spinner,
  Stack,
  Text,
} from "@forge/react";

// SuggestionsPanel displays suggestion checkboxes and an action to mark all complete.
export default function SuggestionsPanel({
  suggestions,
  onToggle,
  onCompleteAll,
}: {
  suggestions: { id: string; text: string; done: boolean }[];
  onToggle: (id: string) => void;
  onCompleteAll: () => void;
}) {
  return (
    <Box>
      <Heading size="large">Suggestions</Heading>
      <Stack space="space.100">
        {(suggestions || []).map((s) => (
          <Checkbox
            key={s.id}
            label={s.text}
            isChecked={s.done}
            onChange={() => onToggle(s.id)}
          />
        ))}
      </Stack>
      <Box>
        <Button onClick={onCompleteAll} appearance="subtle">
          Complete all
        </Button>
      </Box>
    </Box>
  );
}
