import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { useTranslations } from "next-intl";
import {
  MoreVert,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { ConnectionDto } from "@/types/connection";
import { useConnectionSyncStatusQuery } from "@/hooks/queries/useConnectionQueries";
import { getSupportMessageForSyncError } from "@/constants/supportMessageSyncError";
import { useWebSocketContext } from "@/providers/WebSocketProvider";

interface ConnectionItemProps {
  connection: ConnectionDto;
  onMenuOpen: (
    event: React.MouseEvent<HTMLElement>,
    connectionId: string,
  ) => void;
}

export const ConnectionItem: React.FC<ConnectionItemProps> = ({
  connection,
  onMenuOpen,
}) => {
  const t = useTranslations("profile.JiraConnectionItem");
  const theme = useTheme();
  const { data: statusData, isLoading } = useConnectionSyncStatusQuery(
    connection.id,
  );

  const [localStatus, setLocalStatus] = useState<string | undefined>(undefined);
  const [localError, setLocalError] = useState<any | undefined>(undefined);

  useEffect(() => {
    if (statusData?.data) {
      setLocalStatus(statusData.data.sync_status);
      setLocalError(statusData.data.sync_error);
    }
  }, [statusData]);

  const { subscribe, unsubscribe } = useWebSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleMessage = (data: any) => {
      console.log("Received WebSocket message for connection:", data);
      if (data.id === connection.id) {
        setLocalStatus(data.sync_status);
        setLocalError(data.sync_error);
        queryClient.invalidateQueries({
          queryKey: ["connection", "syncStatus", connection.id],
        });
      }
    };

    subscribe(`connection:${connection.id}`, handleMessage);
    return () => unsubscribe(`connection:${connection.id}`, handleMessage);
  }, [connection.id, subscribe, unsubscribe, queryClient]);

  const statusDto = statusData?.data;
  const syncStatus =
    localStatus !== undefined ? localStatus : statusDto?.sync_status;
  const syncError =
    localError !== undefined ? localError : statusDto?.sync_error;

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
          title={syncStatus}
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
            {syncStatus || t("error")}
          </Typography>
          <Tooltip title={getSupportMessageForSyncError(syncError)} arrow>
            <InfoIcon
              fontSize="small"
              sx={{
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
            {t("synced")}
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
          {syncStatus || t("syncing")}
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
        bgcolor: syncError
          ? theme.vars
            ? "error.soft"
            : alpha(theme.palette.error.main, 0.05)
          : "tertiaryContainer",
        overflow: "hidden", // Extra safety
        color: syncError ? theme.palette.error.main : "onTertiaryContainer",
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
          {connection.name || t("defaultName")}
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
