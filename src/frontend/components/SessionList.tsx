import { SessionSummary } from "@/types";
import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import {
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  LinearProgress,
  Chip,
  ChipProps,
} from "@mui/material";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { useTranslations } from "next-intl";

export interface SessionItem {
  id: string;
  title: string;
  subtitle?: string;
  chips?: Array<{ label: string; color?: ChipProps["color"] }>;
  running?: boolean;
}

export interface SessionListProps {
  sessions: SessionItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  emptyStateText?: string;
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  selectedId,
  onSelect,
  loading,
  emptyStateText,
}) => {
  const t = useTranslations("SessionList");
  const finalEmptyStateText = emptyStateText || t("noSessions");

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!sessions.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        {finalEmptyStateText}
      </Typography>
    );
  }

  return (
    <List
      sx={{
        minHeight: 0,
        overflowY: "auto",
        pr: 1,
        ...scrollBarSx,
      }}
    >
      {sessions.map((session) => (
        <ListItem key={session.id} disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => onSelect(session.id)}
            selected={selectedId === session.id}
            sx={{
              borderRadius: 1,
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {session.running && (
                    <LinearProgress
                      color="inherit"
                      sx={{ width: "100%", height: 4, borderRadius: 2 }}
                    />
                  )}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                    }}
                  >
                    <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
                      {session.title}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                      }}
                    >
                      {session.chips?.map((chip, index) => (
                        <Chip
                          key={`${session.id}-chip-${index}`}
                          label={chip.label}
                          size="small"
                          color={chip.color}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              }
              secondary={
                session.subtitle ? (
                  <Typography variant="caption" noWrap>
                    {session.subtitle}
                  </Typography>
                ) : undefined
              }
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default SessionList;
