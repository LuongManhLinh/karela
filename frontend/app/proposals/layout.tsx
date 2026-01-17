"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Divider, Stack, Typography, Button } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

import { proposalService } from "@/services/proposalService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorSnackbar } from "@/components/ErrorSnackbar";
import { ProposalCard } from "@/components/proposals/ProposalCard";
import type {
  ProposalActionFlag,
  SessionsHavingProposals,
  ProposalContentDto,
  ProposalDto,
  ProposalSource,
} from "@/types/proposal";
import type { JiraConnectionDto } from "@/types/integration";
import { DoubleLayout } from "@/components/Layout";
import { SessionStartForm } from "@/components/SessionStartForm";
import SessionList, { SessionItem } from "@/components/SessionList";
import HeaderContent from "@/components/HeaderContent";
import { downloadAsJson } from "@/utils/export_utils";
import { scrollBarSx } from "@/constants/scrollBarSx";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useUserConnectionsQuery } from "@/hooks/queries/useUserQueries";

const ProposalPageContent: React.FC = () => {
  const { selectedConnectionId, setSelectedConnectionId } = useWorkspaceStore();

  const { data: connectionsData, isLoading: isConnectionsLoading } =
    useUserConnectionsQuery();
  // Find full connection object from ID
  const connections = connectionsData?.data?.jira_connections || [];
  const selectedConnection =
    connections.find((c) => c.id === selectedConnectionId) || null;

  const [loadingProposals, setLoadingProposals] = useState(false);

  const [sessions, setSessions] = useState<SessionsHavingProposals | null>(
    null
  );

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [selectedSessionSource, setSelectedSessionSource] =
    useState<ProposalSource | null>(null);
  const [proposals, setProposals] = useState<ProposalDto[]>([]);

  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (connections.length > 0) {
      if (
        !selectedConnectionId ||
        !connections.find((c) => c.id === selectedConnectionId)
      ) {
        setSelectedConnectionId(connections[0].id);
      }
    }
  }, [connections, selectedConnectionId, setSelectedConnectionId]);

  const loadSessions = async (connId: string) => {
    if (!connId) return;
    setLoadingProposals(true);
    try {
      const response = await proposalService.getProposalsByConnection(connId);
      setSessions(response.data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to load proposals";
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleConnectionChange = async (conn: JiraConnectionDto | null) => {
    setSelectedConnectionId(conn?.id || null);
    setSelectedSessionId(null);
    setSessions(null);
    setProposals([]);
    if (conn) await loadSessions(conn.id);
  };

  const handleRefresh = async () => {
    await loadSessions(selectedConnection!.id);
  };

  const handleSelectSession = async (
    sessionId: string,
    source: ProposalSource
  ) => {
    setSelectedSessionId(sessionId);
    setSelectedSessionSource(source);
    try {
      setLoadingProposals(true);
      const res = await proposalService.getProposalsBySession(
        sessionId,
        source
      );
      setProposals(res.data || []);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to load proposals for session";
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleProposalAction = async (
    proposalId: string,
    flag: ProposalActionFlag
  ) => {
    try {
      await proposalService.actOnProposal(proposalId, flag);
      await loadSessions(selectedConnection!.id);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to update proposal";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const handleProposalContentAction = async (
    proposalId: string,
    content: ProposalContentDto,
    flag: ProposalActionFlag
  ) => {
    if (!content.id) return;
    try {
      await proposalService.actOnProposalContent(proposalId, content.id, flag);
      await handleSelectSession(selectedSessionId!, selectedSessionSource!);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to update proposal content";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const analysisSessions = useMemo<SessionItem[]>(() => {
    if (!sessions) return [];

    return sessions.analysis_sessions.map((session) => ({
      id: session.id,
      title: session.key,
      subtitle: new Date(session.created_at).toLocaleString(),
    }));
  }, [sessions]);

  const chatSessions = useMemo<SessionItem[]>(() => {
    if (!sessions) return [];

    return sessions.chat_sessions.map((session) => ({
      id: session.id,
      title: session.key,
      subtitle: new Date(session.created_at).toLocaleString(),
    }));
  }, [sessions]);

  const handleExportProposals = () => {
    if (proposals.length === 0) return;
    const selectedSessionKey = sessions
      ? selectedSessionSource === "ANALYSIS"
        ? sessions.analysis_sessions.find((s) => s.id === selectedSessionId)
            ?.key
        : sessions.chat_sessions.find((s) => s.id === selectedSessionId)?.key
      : selectedSessionId;
    const filename = `proposals_${selectedSessionSource?.toLowerCase()}_${selectedSessionKey}_${
      new Date().toISOString().split("T")[0]
    }`;
    downloadAsJson(proposals, filename);
  };

  const proposalsContent = (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100%",
        ...scrollBarSx,
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box sx={{ width: "70%", py: 2 }}>
          {loadingProposals ? (
            <LoadingSpinner />
          ) : sessions === null ? (
            <Typography color="text.secondary" textAlign="center">
              No proposals found for this connection.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {proposals.length > 0 && (
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<FileDownloadIcon />}
                    onClick={handleExportProposals}
                  >
                    Export to JSON
                  </Button>
                </Box>
              )}
              {proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onProposalAction={handleProposalAction}
                  onProposalContentAction={handleProposalContentAction}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Box>
      <ErrorSnackbar
        open={showError}
        message={error}
        onClose={() => setShowError(false)}
      />
    </Box>
  );

  return (
    <DoubleLayout
      leftChildren={
        <Box
          sx={{
            p: 2,
            height: "100%",
            flexDirection: "column",
            display: "flex",
          }}
        >
          <SessionStartForm
            connectionOptions={{
              options: connections,
              selectedOption: selectedConnection,
              onChange: handleConnectionChange,
            }}
            loadingConnections={isConnectionsLoading}
          />
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="subtitle2"
            sx={{
              textTransform: "uppercase",
              mb: 1,
              ml: 2,
              color: "text.secondary",
            }}
          >
            Analysis Proposals
          </Typography>
          <SessionList
            sessions={analysisSessions}
            selectedId={selectedSessionId || null}
            onSelect={(id: string) => handleSelectSession(id, "ANALYSIS")}
            emptyStateText="No analysis sessions having proposals"
          />
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="subtitle2"
            sx={{
              textTransform: "uppercase",
              mb: 1,
              ml: 2,
              color: "text.secondary",
            }}
          >
            Chat Proposals
          </Typography>
          <SessionList
            sessions={chatSessions}
            selectedId={selectedSessionId || null}
            onSelect={(id: string) => handleSelectSession(id, "CHAT")}
            emptyStateText="No chat sessions having proposals"
          />
        </Box>
      }
      rightChildren={proposalsContent}
      appBarLeftContent={<HeaderContent headerText="Proposals" />}
      appBarTransparent
    />
  );
};

export default ProposalPageContent;
