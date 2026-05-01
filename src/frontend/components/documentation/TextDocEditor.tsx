import React from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { scrollBarSx } from "@/constants/scrollBarSx";

export const TextDocEditor: React.FC<{
  title: string;
  nameValue: string;
  descValue: string;
  contentValue: string;
  onNameChange: (newName: string) => void;
  onDescChange: (newDesc: string) => void;
  onContentChange: (newContent: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saveTitle: string;
}> = ({
  title,
  nameValue,
  descValue,
  contentValue,
  onNameChange,
  onDescChange,
  onContentChange,
  onSave,
  onCancel,
  saveTitle,
}) => {
  const t = useTranslations("DocumentationPage");
  return (
    <Paper
      elevation={3}
      sx={{ p: 2, mb: 3, bgcolor: "surfaceContainerHighest" }}
    >
      <Stack spacing={2}>
        <Typography variant="subtitle1" fontWeight="bold">
          {title}
        </Typography>
        <TextField
          fullWidth
          label={t("nameRequiredLabel")}
          value={nameValue}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={false}
        />
        <TextField
          fullWidth
          label={t("descriptionOptionalLabel")}
          value={descValue}
          onChange={(e) => onDescChange(e.target.value)}
          disabled={false}
        />
        <TextField
          fullWidth
          multiline
          minRows={5}
          maxRows={15}
          label={t("contentRequiredLabel")}
          value={contentValue}
          onChange={(e) => onContentChange(e.target.value)}
          disabled={false}
          sx={{ ...scrollBarSx }}
        />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="outlined" color="inherit" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button variant="contained" onClick={onSave}>
            {saveTitle}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};
