import React, { use } from "react";

import { Box, Chip, IconButton, Stack, Typography, Paper } from "@mui/material";
import {
  Edit as EditIcon,
  Cancel as CancelIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useTranslations } from "next-intl";

export const FileDocItem: React.FC<{
  name: string;
  icon: React.ReactNode;
  description?: string;
  onEdit: () => void;
  onRemove: () => void;
  onDownload?: () => void;
  chipLabel?: string;
  chipColor?:
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning";
}> = ({
  name,
  icon,
  description,
  onEdit,
  onRemove,
  onDownload,
  chipLabel,
  chipColor,
}) => {
  const t = useTranslations("DocumentationManager");
  return (
    <Paper
      elevation={2}
      sx={{ p: 2, mb: 2, bgcolor: "surfaceContainerHighest" }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={1.5} alignItems="center">
          {icon}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" fontWeight="bold">
                {name}
              </Typography>

              <Chip size="small" label={chipLabel} color={chipColor} />
            </Stack>
            {description && (
              <Typography variant="caption" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" color="primary" onClick={onEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton color="error" size="small" onClick={onRemove}>
            <CancelIcon fontSize="small" />
          </IconButton>
          {onDownload && (
            <IconButton color="primary" size="small" onClick={onDownload}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};
