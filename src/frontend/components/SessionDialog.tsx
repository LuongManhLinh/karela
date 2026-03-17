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
  projectOptions: SelectableOptions<ProjectDto>;
  storyOptions?: SelectableOptions<StorySummary>;
  onPrimarySubmit?: (project: ProjectDto, story?: StorySummary) => void;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  onSecondarySubmit?: (project: ProjectDto, story?: StorySummary) => void;
  secondaryLabel?: string;
  secondaryDisabled?: boolean;
  showUseStoryCheckbox?: boolean;
  requireStory?: boolean;
}

export const SessionFilterDialog: React.FC<SessionFilterDialogProps> = ({
  open,
  onClose,
  title,
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
  const t = useTranslations("Common");
  const [storyFilterable, setStoryFilterable] = useState(Boolean(requireStory));

  const handleStoryCheckboxChange = (value: boolean) => {
    setStoryFilterable(value);
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
          {showUseStoryCheckbox && (
            <>
              <Checkbox
                checked={storyFilterable}
                onChange={(e) => handleStoryCheckboxChange(e.target.checked)}
                title="Filter with story"
              />
              {t("filterWithStory")}
            </>
          )}
        </Box>
        <SessionStartForm
          projectOptions={projectOptions}
          storyOptions={storyFilterable ? storyOptions : undefined}
          primaryAction={{
            label: primaryLabel || t("submit"),
            onClick: () => {
              if (onPrimarySubmit && projectOptions.selectedOption) {
                onPrimarySubmit(
                  projectOptions?.selectedOption,
                  (storyFilterable && storyOptions?.selectedOption) ||
                    undefined,
                );
              }
            },
            disabled:
              primaryDisabled ||
              !projectOptions?.selectedOption ||
              (requireStory && !storyOptions?.selectedOption),
          }}
          secondaryAction={
            onSecondarySubmit
              ? {
                  label: secondaryLabel || t("submit"),
                  onClick: () => {
                    if (onSecondarySubmit && projectOptions.selectedOption) {
                      onSecondarySubmit(
                        projectOptions.selectedOption,

                        (storyFilterable && storyOptions?.selectedOption) ||
                          undefined,
                      );
                    }
                  },
                  disabled:
                    secondaryDisabled ||
                    !projectOptions?.selectedOption ||
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
  projectOptions: SelectableOptions<ProjectDto>;
  storyOptions?: SelectableOptions<StorySummary>;
  onPrimarySubmit?: (project: ProjectDto, story?: StorySummary) => void;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  onSecondarySubmit?: (project: ProjectDto, story?: StorySummary) => void;
  secondaryLabel?: string;
  secondaryDisabled?: boolean;
  showUseStoryCheckbox?: boolean;
  requireStory?: boolean;
}

export const SessionStartDialog: React.FC<SessionStartDialogProps> = ({
  open,
  onClose,
  title,
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
      projectOptions={projectOptions}
      storyOptions={storyOptions}
      onPrimarySubmit={onPrimarySubmit ? onPrimarySubmit : undefined}
      primaryLabel={primaryLabel}
      primaryDisabled={primaryDisabled}
      onSecondarySubmit={onSecondarySubmit ? onSecondarySubmit : undefined}
      secondaryLabel={secondaryLabel}
      secondaryDisabled={secondaryDisabled}
      showUseStoryCheckbox={showUseStoryCheckbox}
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
    projects,
    stories,
    selectedProject,
    setSelectedProject,
    setStories,
    selectedStory,
    setSelectedStory,
  } = useWorkspaceStore();

  const router = useRouter();

  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [isStoriesLoading, setIsStoriesLoading] = useState(false);

  const handleProjectChange = async (proj: ProjectDto | null) => {
    setIsStoriesLoading(true);
    setSelectedProject(proj);
    setSelectedStory(null);
    if (proj) {
      const storiesData = await connectionService.getStorySummaries(proj.key);
      setStories(storiesData?.data || []);
    }
    setIsStoriesLoading(false);
  };

  const handleStoryChange = async (story: StorySummary | null) => {
    setSelectedStory(story);
  };

  const handleFilter = async (project: ProjectDto, story?: StorySummary) => {
    if (!project) {
      router.push(`/app/${href || ""}`);
    } else if (!story) {
      console.log("Navigating to project level:", project.key);
      router.push(`/app/projects/${project.key}/${href || ""}`);
    } else {
      console.log("Navigating to story level:", story.key);
      router.push(
        `/app/projects/${project.key}/stories/${story.key}/${href || ""}`,
      );
    }
    onClose();
  };

  return (
    <SessionFilterDialog
      open={open}
      onClose={onClose}
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
      showUseStoryCheckbox={true}
    />
  );
};
