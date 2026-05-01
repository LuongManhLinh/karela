import React from "react";
import { Box, Chip, IconButton, Paper, Stack, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import { useTranslations } from "next-intl";
import { scrollBarSx } from "@/constants/scrollBarSx";

export const TextDocItem: React.FC<{
  name: string;
  description?: string;
  content: string;
  pending?: boolean;
  onEdit: () => void;
  onRemove: () => void;
}> = ({ name, description, content, pending, onEdit, onRemove }) => {
  const t = useTranslations("DocumentationPage");
  return (
    <Paper
      elevation={2}
      sx={{ p: 2, mb: 2, bgcolor: "surfaceContainerHighest" }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={1}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" fontWeight="bold">
              {name}
            </Typography>
            {pending && (
              <Chip size="small" label={t("pendingLabel")} color="warning" />
            )}
          </Stack>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" color="primary" onClick={onEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={onRemove}>
            <CancelIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
      <Box
        sx={{
          borderRadius: 1,
          maxHeight: 200,
          overflowY: "auto",
          ...scrollBarSx,
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {content}
        </Typography>
      </Box>
    </Paper>
  );
};
