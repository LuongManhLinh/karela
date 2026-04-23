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
  Link,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import {
  MoreVert,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  PermDataSetting,
} from "@mui/icons-material";
import { ConnectionDto, SyncStatus } from "@/types/connection";
import { useConnectionSyncStatusQuery } from "@/hooks/queries/useConnectionQueries";
import { getSupportMessageForSyncError } from "@/constants/supportMessageSyncError";
import { useWebSocketContext } from "@/providers/WebSocketProvider";

interface ConnectionItemProps {
  connection: ConnectionDto;
}

export const ConnectionItem: React.FC<ConnectionItemProps> = ({
  connection,
}) => {
  const t = useTranslations("profile.JiraConnectionItem");
  const theme = useTheme();
  const { data: statusData, isLoading } = useConnectionSyncStatusQuery();

  const [localStatus, setLocalStatus] = useState<SyncStatus | undefined>(
    undefined,
  );
  const [localMessage, setLocalMessage] = useState<string | undefined>(
    undefined,
  );
  const [localError, setLocalError] = useState<any | undefined>(undefined);

  useEffect(() => {
    if (statusData?.data) {
      setLocalStatus(statusData.data.sync_status);
      setLocalMessage(statusData.data.sync_message);
      setLocalError(statusData.data.sync_error);
    }
  }, [statusData]);

  const { subscribe, unsubscribe } = useWebSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleMessage = (data: any) => {
      if (data.id === connection.id) {
        setLocalStatus(data.sync_status);
        setLocalMessage(data.sync_message);
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
  const syncMessage =
    localMessage !== undefined ? localMessage : statusDto?.sync_message;
  const syncError =
    localError !== undefined ? localError : statusDto?.sync_error;

  const getStatusContent = () => {
    if (isLoading) {
      return <CircularProgress size={20} />;
    }

    if (syncStatus === "not_started") {
      return (
        <Typography variant="body2" color="text.secondary" noWrap>
          {t("notSynced")}
        </Typography>
      );
    }

    if (syncStatus === "failed" || syncStatus === "setup_failed") {
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
          title={syncMessage}
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
            {syncMessage || t("error")}
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

    if (syncStatus === "done") {
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

    if (syncStatus === "setup_done") {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: theme.palette.warning.main,
          }}
        >
          <PermDataSetting fontSize="small" sx={{ flexShrink: 0 }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
            {t("setupDone")}
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
          {syncMessage || t("syncing")}
        </Typography>
      </Box>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        borderRadius: 1,
        bgcolor: "inherit",
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
            component={Link}
            sx={{
              cursor: "pointer",
            }}
            onClick={() => {
              // Open the url in a new window
              console.log("Opening URL:", connection.url);
              window.open(connection.url, "_blank", "noopener,noreferrer");
            }}
          >
            {connection.url}
          </Typography>
        )}
      </Box>
      <Box sx={{ mt: 0.5 }}>{getStatusContent()}</Box>
    </Paper>
  );
};
