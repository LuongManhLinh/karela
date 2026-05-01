"use client";

import React, { useState } from "react";
import { Container, Paper, Typography, Divider } from "@mui/material";
import { Layout } from "@/components/Layout";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import type { ProjectDto } from "@/types/connection";
import { SessionStartForm } from "@/components/SessionStartForm";
import { useTranslations } from "next-intl";
import {
  DocumentationManager,
  PendingTextDoc,
  PendingFileDoc,
} from "@/components/documentation/DocumentationManager";
import { ProjectDescriptionEditor } from "@/components/documentation/ProjectDescriptionEditor";
import { useBulkUploadDocsMutation } from "@/hooks/queries/useDocumentationQueries";
import { useNotificationContext } from "@/providers/NotificationProvider";

export default function DocumentationPage() {
  const { projects } = useWorkspaceStore();
  const [selectedProject, setSelectedProject] = useState<ProjectDto | null>(
    projects.length > 0 ? projects[0] : null,
  );

  const projectKey = selectedProject?.key || "";
  const t = useTranslations("DocumentationPage");

  const handleProjectKeyChange = (project: ProjectDto | null) => {
    setSelectedProject(project);
    setPendingTextDocs([]);
    setPendingFileDocs([]);
  };

  const [pendingTextDocs, setPendingTextDocs] = useState<PendingTextDoc[]>([]);
  const [pendingFileDocs, setPendingFileDocs] = useState<PendingFileDoc[]>([]);
  const { notify } = useNotificationContext();
  const { mutateAsync: bulkUploadDocs, isPending: isSavingPending } =
    useBulkUploadDocsMutation(projectKey);

  const handleSavePending = async () => {
    if (pendingTextDocs.length === 0 && pendingFileDocs.length === 0) return;
    try {
      await bulkUploadDocs({
        textDocs: pendingTextDocs.map((d) => ({
          name: d.name,
          content: d.content,
          description: d.description,
        })),
        fileDocs: pendingFileDocs.map((d) => ({
          file: d.file,
          description: d.description,
        })),
      });
      notify(t("bulkUploadSuccess"), { severity: "success" });
      setPendingTextDocs([]);
      setPendingFileDocs([]);
    } catch (e: any) {
      // Error is handled in the mutation
    }
  };

  return (
    <Layout
      appBarLeftContent={
        <Typography variant="h5" py={2}>
          {t("title")}
        </Typography>
      }
      appBarTransparent
      basePath={`/app/projects/${projectKey}`}
    >
      <Container maxWidth="md" sx={{ py: 4, overflowY: "auto" }}>
        <Paper
          elevation={4}
          sx={{ p: 3, mb: 3, borderRadius: 1, bgcolor: "background.paper" }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            {t("projects")}
          </Typography>
          <SessionStartForm
            projectOptions={{
              options: projects,
              selectedOption: selectedProject,
              onChange: handleProjectKeyChange,
            }}
          />
        </Paper>

        {selectedProject && (
          <Paper
            elevation={4}
            sx={{
              p: 3,
              borderRadius: 1,
              bgcolor: "background.paper",
              minHeight: 600,
            }}
          >
            <ProjectDescriptionEditor
              projectKey={projectKey}
              showHelperText={false}
            />
            <Typography variant="h6" gutterBottom>
              {t("projectDocumentation")}
            </Typography>
            <DocumentationManager
              projectKey={projectKey}
              pendingTextDocs={pendingTextDocs}
              setPendingTextDocs={setPendingTextDocs}
              pendingFileDocs={pendingFileDocs}
              setPendingFileDocs={setPendingFileDocs}
              onSavePending={handleSavePending}
              isSavingPending={isSavingPending}
            />
          </Paper>
        )}
      </Container>
    </Layout>
  );
}
