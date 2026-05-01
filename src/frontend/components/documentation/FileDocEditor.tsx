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

export const FileDocEditor: React.FC<{
  icon: React.ReactNode;
  name: string;
  description: string;
  onDescriptionChange: (newDesc: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saveTitle: string;
}> = ({
  icon,
  name,
  description,
  onDescriptionChange,
  onSave,
  onCancel,
  saveTitle,
}) => {
  const t = useTranslations("DocumentationPage");
  return (
    <Paper
      elevation={3}
      sx={{ p: 2, mb: 2, bgcolor: "surfaceContainerHighest" }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {icon}
          <Typography variant="subtitle2" fontWeight="bold">
            {name}
          </Typography>
        </Stack>
        <TextField
          fullWidth
          size="small"
          label={t("descriptionOptionalLabel")}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
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
