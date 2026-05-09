import React from "react";
import {
  Box,
  Typography,
  Paper,
  Tooltip,
  useTheme,
  CircularProgress,
  Link,
} from "@mui/material";
import { useTranslations } from "next-intl";
import {
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  PermDataSetting,
} from "@mui/icons-material";
import {
  ConnectionDto,
  ConnectionSyncError,
  SyncStatus,
} from "@/types/connection";
import { getSupportMessageForSyncError } from "@/constants/supportMessageSyncError";

type ConnectionItemProps = {
  connection: ConnectionDto;
  syncStatus?: SyncStatus;
  syncMessage?: string;
  syncError?: ConnectionSyncError;
  isLoading?: boolean;
};

export const ConnectionItem: React.FC<ConnectionItemProps> = ({
  connection,
  syncStatus,
  syncMessage,
  syncError,
  isLoading = false,
}) => {
  const t = useTranslations("profile.JiraConnectionItem");
  const theme = useTheme();

  const getStatusContent = () => {
    if (isLoading) {
      return <CircularProgress size={20} />;
    }

    if (syncStatus === "not_started") {
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
          <Typography variant="body2" color="text.secondary" noWrap>
            {t("pendingSync")}
          </Typography>
        </Box>
      );
    }

    if (syncStatus === "failed" || syncStatus === "setup_failed") {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: theme.palette.error.main,
            flexShrink: 1,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              flexGrow: 1,
              flexShrink: 1,
              minWidth: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={syncMessage}
          >
            {syncMessage || t("error")}
          </Typography>

          <Tooltip
            title={getSupportMessageForSyncError(syncError ?? "unknown_error")}
            arrow
          >
            <InfoIcon
              fontSize="small"
              sx={{
                opacity: 0.7,
                flexShrink: 0,
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
        width: "100%",
        overflow: "hidden",
        bgcolor: "transparent",
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
            flexShrink: 0,
          }}
        />
      )}

      <Box sx={{ mr: "auto" }}>
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
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            onClick={() => {
              window.open(connection.url, "_blank", "noopener,noreferrer");
            }}
          >
            {connection.url}
          </Typography>
        )}
      </Box>

      {getStatusContent()}
    </Paper>
  );
};
