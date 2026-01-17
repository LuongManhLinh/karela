import React from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  MoreVert,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { JiraConnectionDto } from "@/types/integration";
import { useConnectionSyncStatusQuery } from "@/hooks/queries/useUserQueries";
import { getSupportMessageForSyncError } from "@/constants/supportMessageSyncError";

interface JiraConnectionItemProps {
  connection: JiraConnectionDto;
  onMenuOpen: (
    event: React.MouseEvent<HTMLElement>,
    connectionId: string
  ) => void;
}

export const JiraConnectionItem: React.FC<JiraConnectionItemProps> = ({
  connection,
  onMenuOpen,
}) => {
  const theme = useTheme();
  const { data: statusData, isLoading } = useConnectionSyncStatusQuery(
    connection.id
  );

  const statusDto = statusData?.data;
  const syncStatus = statusDto?.sync_status;
  const syncError = statusDto?.sync_error;

  const getStatusContent = () => {
    if (isLoading) {
      return <CircularProgress size={20} />;
    }

    if (syncError) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            color: theme.palette.error.main,
            width: "100%", // changed from maxWidth to width to fill available space
          }}
        >
          <Typography
            variant="body2"
            noWrap
            sx={{
              fontWeight: 500,
              // These two lines are critical for the text itself to truncate
              minWidth: 0,
              flexGrow: 1,
              display: "block", // Ensures noWrap behaves correctly
            }}
          >
            {syncStatus || "Error"}
          </Typography>
          <Tooltip title={getSupportMessageForSyncError(syncError)} arrow>
            <InfoIcon
              fontSize="small"
              sx={{
                cursor: "help",
                opacity: 0.7,
                flexShrink: 0, // Prevents icon from getting squashed
              }}
            />
          </Tooltip>
        </Box>
      );
    }

    if (syncStatus === "SYNCED") {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: theme.palette.success.main,
          }}
        >
          <CheckCircleIcon fontSize="small" sx={{ flexShrink: 0 }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
            Synced
          </Typography>
        </Box>
      );
    }

    // Still syncing or unknown state not synced yet
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: theme.palette.text.secondary,
        }}
      >
        <CircularProgress size={16} color="inherit" sx={{ flexShrink: 0 }} />
        <Typography variant="body2" noWrap>
          {syncStatus || "Syncing..."}
        </Typography>
      </Box>
    );
  };

  return (
    <Paper
      elevation={1}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        borderRadius: 1,
        border: `1.5px solid ${
          syncError ? theme.palette.error.light : theme.palette.divider
        }`,
        bgcolor: syncError
          ? theme.vars
            ? "error.soft"
            : alpha(theme.palette.error.main, 0.05)
          : "background.paper",
        overflow: "hidden", // Extra safety
      }}
    >
      {connection.avatar_url && (
        <Box
          component="img"
          src={connection.avatar_url}
          alt={connection.name || "Jira"}
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            flexShrink: 0, // Prevent avatar from squashing
          }}
        />
      )}

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body1" fontWeight="medium" noWrap>
          {connection.name || "Jira Connection"}
        </Typography>

        {connection.url && (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            noWrap
          >
            {connection.url}
          </Typography>
        )}
      </Box>
      <Box sx={{ mt: 0.5 }}>{getStatusContent()}</Box>

      <IconButton
        onClick={(e) => onMenuOpen(e, connection.id)}
        sx={{ flexShrink: 0 }}
      >
        <MoreVert />
      </IconButton>
    </Paper>
  );
};
