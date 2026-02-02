import { ConnectionDto, ProjectDto, StorySummary } from "@/types/connection";
import { SelectableOptions, SessionStartForm } from "./SessionStartForm";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Checkbox,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useRouter } from "next/navigation";
import { connectionService } from "@/services/connectionService";

export interface SessionFilterDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  connectionOptions: SelectableOptions<ConnectionDto>;
  projectOptions?: SelectableOptions<ProjectDto>;
  storyOptions?: SelectableOptions<StorySummary>;
  onPrimarySubmit?: (
    connection: ConnectionDto,
    project?: ProjectDto,
    story?: StorySummary,
  ) => void;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  onSecondarySubmit?: (
    connection: ConnectionDto,
    project?: ProjectDto,
    story?: StorySummary,
  ) => void;
  secondaryLabel?: string;
  secondaryDisabled?: boolean;
  showUseProjectCheckbox?: boolean;
  showUseStoryCheckbox?: boolean;
  requireProject?: boolean;
  requireStory?: boolean;
}

export const SessionFilterDialog: React.FC<SessionFilterDialogProps> = ({
  open,
  onClose,
  title,
  connectionOptions,
  projectOptions,
  storyOptions,
  onPrimarySubmit,
  primaryLabel,
  primaryDisabled,
  onSecondarySubmit,
  secondaryLabel,
  secondaryDisabled,
  showUseProjectCheckbox,
  showUseStoryCheckbox,
  requireProject,
  requireStory,
}) => {
  const t = useTranslations("Common");
  const [projectFilterable, setProjectFilterable] = useState(
    Boolean(requireProject),
  );
  const [storyFilterable, setStoryFilterable] = useState(Boolean(requireStory));

  const handleProjectCheckboxChange = (value: boolean) => {
    setProjectFilterable(value);
    if (!value) {
      setStoryFilterable(false);
    }
  };

  const handleStoryCheckboxChange = (value: boolean) => {
    setStoryFilterable(value);
    if (value) {
      setProjectFilterable(true);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {title}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            justifyContent: "left",
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {showUseProjectCheckbox && (
            <>
              <Checkbox
                checked={projectFilterable}
                onChange={(e) => handleProjectCheckboxChange(e.target.checked)}
                title="Use Project"
              />
              Use Project
            </>
          )}
          {showUseStoryCheckbox && (
            <>
              <Checkbox
                checked={storyFilterable}
                onChange={(e) => handleStoryCheckboxChange(e.target.checked)}
                title="Use Story"
              />
              Use Story
            </>
          )}
        </Box>
        <SessionStartForm
          connectionOptions={connectionOptions}
          projectOptions={projectFilterable ? projectOptions : undefined}
          storyOptions={storyFilterable ? storyOptions : undefined}
          primaryAction={{
            label: primaryLabel || t("submit"),
            onClick: () => {
              if (onPrimarySubmit && connectionOptions.selectedOption) {
                onPrimarySubmit(
                  connectionOptions.selectedOption,
                  projectOptions?.selectedOption || undefined,
                  storyOptions?.selectedOption || undefined,
                );
              }
            },
            disabled:
              primaryDisabled ||
              !connectionOptions.selectedOption ||
              (requireProject && !projectOptions?.selectedOption) ||
              (requireStory && !storyOptions?.selectedOption),
          }}
          secondaryAction={
            onSecondarySubmit
              ? {
                  label: secondaryLabel || t("submit"),
                  onClick: () => {
                    if (onSecondarySubmit && connectionOptions.selectedOption) {
                      onSecondarySubmit(
                        connectionOptions.selectedOption,
                        projectOptions?.selectedOption || undefined,
                        storyOptions?.selectedOption || undefined,
                      );
                    }
                  },
                  disabled:
                    secondaryDisabled ||
                    !connectionOptions.selectedOption ||
                    (requireProject && !projectOptions?.selectedOption) ||
                    (requireStory && !storyOptions?.selectedOption),
                }
              : undefined
          }
        />
      </DialogContent>
    </Dialog>
  );
};

export interface SessionStartDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  connectionOptions: SelectableOptions<ConnectionDto>;
  projectOptions?: SelectableOptions<ProjectDto>;
  storyOptions?: SelectableOptions<StorySummary>;
  onPrimarySubmit?: (
    connection: ConnectionDto,
    project: ProjectDto,
    story?: StorySummary,
  ) => void;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  onSecondarySubmit?: (
    connection: ConnectionDto,
    project: ProjectDto,
    story?: StorySummary,
  ) => void;
  secondaryLabel?: string;
  secondaryDisabled?: boolean;
  showUseStoryCheckbox?: boolean;
  requireStory?: boolean;
}

export const SessionStartDialog: React.FC<SessionStartDialogProps> = ({
  open,
  onClose,
  title,
  connectionOptions,
  projectOptions,
  storyOptions,
  onPrimarySubmit,
  primaryLabel,
  primaryDisabled,
  onSecondarySubmit,
  secondaryLabel,
  secondaryDisabled,
  showUseStoryCheckbox,
  requireStory,
}) => {
  return (
    <SessionFilterDialog
      open={open}
      onClose={onClose}
      title={title}
      connectionOptions={connectionOptions}
      projectOptions={projectOptions}
      storyOptions={storyOptions}
      onPrimarySubmit={
        onPrimarySubmit
          ? (connection, project, story) => {
              if (project) {
                onPrimarySubmit(connection, project, story);
              }
            }
          : undefined
      }
      primaryLabel={primaryLabel}
      primaryDisabled={primaryDisabled}
      onSecondarySubmit={
        onSecondarySubmit
          ? (connection, project, story) => {
              if (project) {
                onSecondarySubmit(connection, project, story);
              }
            }
          : undefined
      }
      secondaryLabel={secondaryLabel}
      secondaryDisabled={secondaryDisabled}
      showUseProjectCheckbox={false}
      showUseStoryCheckbox={showUseStoryCheckbox}
      requireProject={true}
      requireStory={requireStory}
    />
  );
};

export interface DefaultSessionFilterDialogProps {
  open: boolean;
  onClose: () => void;
  href?: string;
}
export const DefaultSessionFilterDialog: React.FC<
  DefaultSessionFilterDialogProps
> = ({ open, onClose, href }) => {
  const tCommon = useTranslations("Common");
  const tPage = useTranslations("PageLayout");

  const {
    connections,
    projects,
    stories,
    selectedConnection,
    setSelectedConnection,
    setProjects,
    selectedProject,
    setSelectedProject,
    setStories,
    selectedStory,
    setSelectedStory,
  } = useWorkspaceStore();

  const router = useRouter();

  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [isStoriesLoading, setIsStoriesLoading] = useState(false);

  const handleConnectionChange = async (conn: ConnectionDto | null) => {
    setIsProjectsLoading(true);
    setSelectedConnection(conn);
    setSelectedProject(null);
    setSelectedStory(null);

    if (conn) {
      const projectsData = await connectionService.getProjects(conn.name);
      setProjects(projectsData?.data || []);
    }
    setIsProjectsLoading(false);
  };

  const handleProjectChange = async (proj: ProjectDto | null) => {
    setIsStoriesLoading(true);
    setSelectedProject(proj);
    setSelectedStory(null);
    if (proj) {
      const storiesData = await connectionService.getStorySummaries(
        selectedConnection!.name,
        proj.key,
      );
      setStories(storiesData?.data || []);
    }
    setIsStoriesLoading(false);
  };

  const handleStoryChange = async (story: StorySummary | null) => {
    setSelectedStory(story);
  };

  const handleFilter = async (
    connection: ConnectionDto,
    project?: ProjectDto,
    story?: StorySummary,
  ) => {
    if (!project) {
      router.push(`/app/connections/${connection.name}/${href || ""}`);
    } else if (!story) {
      router.push(
        `/app/connections/${connection.name}/projects/${project.key}/${href || ""}`,
      );
    } else {
      router.push(
        `/app/connections/${connection.name}/projects/${project.key}/stories/${story.key}/${href || ""}`,
      );
    }
    onClose();
  };

  return (
    <SessionFilterDialog
      open={open}
      onClose={onClose}
      connectionOptions={{
        options: connections,
        onChange: handleConnectionChange,
        selectedOption: selectedConnection,
      }}
      projectOptions={{
        options: projects,
        onChange: handleProjectChange,
        selectedOption: selectedProject,
        loading: isProjectsLoading,
      }}
      storyOptions={{
        options: stories,
        onChange: handleStoryChange,
        selectedOption: selectedStory,
        loading: isStoriesLoading,
      }}
      title={tPage("filterSessions")}
      onPrimarySubmit={handleFilter}
      primaryLabel={tCommon("filter")}
      showUseProjectCheckbox={true}
      showUseStoryCheckbox={true}
    />
  );
};
