"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";

import {
  WorkspaceShell,
  WorkspaceSessionItem,
} from "@/components/WorkspaceShell";
import { userService } from "@/services/userService";
import { proposalService } from "@/services/proposalService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorSnackbar } from "@/components/ErrorSnackbar";
import { ProposalCard } from "@/components/proposals/ProposalCard";
import type {
  ProposalActionFlag,
  ProposalContentDto,
  ProposalDto,
} from "@/types/proposal";
import type { JiraConnectionDto } from "@/types/integration";

const ProposalPageContent: React.FC = () => {
  const [connections, setConnections] = useState<JiraConnectionDto[]>([]);
  const [selectedConnection, setSelectedConnection] =
    useState<JiraConnectionDto | null>(null);
  const [projectKeys, setProjectKeys] = useState<string[]>([]);
  const [projectKey, setProjectKey] = useState("");
  const [storyKeys, setStoryKeys] = useState<string[]>([]);
  const [storyKey, setStoryKey] = useState("");

  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingProposals, setLoadingProposals] = useState(false);

  const [proposals, setProposals] = useState<ProposalDto[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(
    null
  );

  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    void loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoadingConnections(true);
    try {
      const response = await userService.getUserConnections();
      if (response.data) {
        const jiraConnections = response.data.jira_connections || [];
        setConnections(jiraConnections);
        if (jiraConnections.length > 0) {
          const firstConn = jiraConnections[0];
          setSelectedConnection(firstConn);
          await Promise.all([
            loadProjectKeys(firstConn.id),
            loadProposals(firstConn.id),
          ]);
        }
      }
    } catch (err) {
      console.error("Failed to load connections:", err);
    } finally {
      setLoadingConnections(false);
    }
  };

  const loadProjectKeys = async (connId: string) => {
    try {
      const response = await userService.getProjectKeys(connId);
      if (response.data) {
        setProjectKeys(response.data);
        if (response.data.length > 0) {
          const firstProject = response.data[0];
          setProjectKey(firstProject);
          await loadStoryKeys(connId, firstProject);
        } else {
          setProjectKey("");
          setStoryKeys([]);
        }
      }
    } catch (err) {
      console.error("Failed to load project keys:", err);
    }
  };

  const loadStoryKeys = async (connId: string, projKey: string) => {
    try {
      const response = await userService.getIssueKeys(connId, projKey);
      if (response.data) {
        setStoryKeys(["None", ...response.data]);
      }
    } catch (err) {
      console.error("Failed to load story keys:", err);
    }
  };

  const loadProposals = async (connId: string) => {
    if (!connId) return;
    setLoadingProposals(true);
    try {
      const response = await proposalService.getProposalsByConnection(connId);
      const data = response.data || [];
      setProposals(data);
      setSelectedProposalId((prev) =>
        prev && data.some((proposal) => proposal.id === prev)
          ? prev
          : data[0]?.id || null
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to load proposals";
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleConnectionChange = async (conn: JiraConnectionDto) => {
    setSelectedConnection(conn);
    setSelectedProposalId(null);
    setProposals([]);
    await Promise.all([loadProjectKeys(conn.id), loadProposals(conn.id)]);
  };

  const handleProjectKeyChange = async (projKey: string) => {
    setProjectKey(projKey);
    setStoryKey("");
    await loadStoryKeys(selectedConnection!.id, projKey);
  };

  const handleRefresh = async () => {
    await loadProposals(selectedConnection!.id);
  };

  const handleProposalAction = async (
    proposalId: string,
    flag: ProposalActionFlag
  ) => {
    try {
      await proposalService.actOnProposal(proposalId, flag);
      await loadProposals(selectedConnection!.id);
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
      await loadProposals(selectedConnection!.id);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to update proposal content";
      setError(errorMessage);
      setShowError(true);
    }
  };

  const sessionItems = useMemo<WorkspaceSessionItem[]>(() => {
    return proposals.map((proposal) => ({
      id: proposal.id,
      title: `${proposal.project_key} · ${proposal.source}`,
      subtitle: new Date(proposal.created_at).toLocaleString(),
      chips: [
        {
          label: `${proposal.contents.length} changes`,
          color: "default",
        },
      ],
    }));
  }, [proposals]);

  const visibleProposals = useMemo(() => {
    if (!selectedProposalId) {
      return proposals;
    }
    const match = proposals.find(
      (proposal) => proposal.id === selectedProposalId
    );
    return match ? [match] : proposals;
  }, [proposals, selectedProposalId]);

  const handleSelectProposal = (proposalId: string) => {
    setSelectedProposalId((prev) => (prev === proposalId ? null : proposalId));
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
        p: 2,
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
          ) : proposals.length === 0 ? (
            <Typography color="text.secondary" textAlign="center">
              No proposals found for this connection.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {selectedProposalId && visibleProposals.length === 1 && (
                <Typography variant="body2" color="text.secondary">
                  Showing proposal {visibleProposals[0].id}. Select it again to
                  view all proposals.
                </Typography>
              )}
              {visibleProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onProposalAction={handleProposalAction}
                  onProposalContentAction={handleProposalContentAction}
                  defaultExpanded={visibleProposals.length === 1}
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
    <WorkspaceShell
      connections={connections}
      selectedConnection={selectedConnection}
      onConnectionChange={handleConnectionChange}
      selectedProjectKey={projectKey}
      projectKeys={projectKeys}
      onProjectKeyChange={handleProjectKeyChange}
      selectedStoryKey={storyKey}
      storyKeys={storyKeys}
      onStoryKeyChange={setStoryKey}
      onSessionFormSubmit={handleRefresh}
      sessionSubmitLabel="Refresh"
      sessions={sessionItems}
      selectedSessionId={selectedProposalId}
      onSelectSession={handleSelectProposal}
      loadingSessions={loadingProposals}
      loadingConnections={loadingConnections}
      emptyStateText="No proposals in this connection"
      sessionListLabel="Proposals"
      rightChildren={proposalsContent}
      headerText="Proposals"
      appBarTransparent
    />
  );
};

export default ProposalPageContent;
