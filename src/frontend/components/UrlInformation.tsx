"use client";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import {
  AccountTreeOutlined,
  FolderOpenOutlined,
  SubdirectoryArrowRight,
  SummarizeOutlined,
} from "@mui/icons-material";
import { Avatar, Box, Chip, Typography } from "@mui/material";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export const UrlInformation: React.FC = () => {
  const params = useParams();

  const { connectionName, projectKey, storyKey } = useMemo(() => {
    return {
      connectionName: params?.connectionName as string | undefined,
      projectKey: params?.projectKey as string | undefined,
      storyKey: params?.storyKey as string | undefined,
    };
  }, [params]);

  const { connections, projects, stories } = useWorkspaceStore();

  type HierarchyItem = {
    id: "connection" | "project" | "story";
    label: string;
    href: string;
    title: string;
    value: string;
    avatarUrl?: string;
    icon: React.ReactNode;
    helperText?: string;
  };

  const items: HierarchyItem[] = [];

  if (connectionName) {
    const connection = connections.find((conn) => conn.name === connectionName);
    if (!connection) {
      return null;
    }
    items.push({
      id: "connection",
      label: "Connection",
      href: `/app/connections/${connectionName}`,
      title: connection.name,
      value: connection.name,
      avatarUrl: connection.avatar_url,
      icon: <AccountTreeOutlined fontSize="small" />,
      helperText:
        typeof connection.num_projects === "number"
          ? `${connection.num_projects} projects`
          : undefined,
    });
  }

  if (connectionName && projectKey) {
    const project = projects.find((proj) => proj.key === projectKey);
    if (!project) {
      return null;
    }

    items.push({
      id: "project",
      label: "Project",
      href: `/app/connections/${connectionName}/projects/${projectKey}`,
      title: `${project.key} - ${project.name}`,
      value: `${project.key} - ${project.name}`,
      avatarUrl: project.avatar_url,
      icon: <FolderOpenOutlined fontSize="small" />,
      helperText:
        typeof project.num_stories === "number"
          ? `${project.num_stories} stories`
          : undefined,
    });
  }

  if (connectionName && projectKey && storyKey) {
    const story = stories.find((s) => s.key === storyKey);
    if (!story) {
      return null;
    }
    const storySummary = story.summary || "Untitled story";

    items.push({
      id: "story",
      label: "Story",
      href: `/app/connections/${connectionName}/projects/${projectKey}/stories/${storyKey}`,
      title: `${story.key} - ${storySummary}`,
      value: `${story.key} - ${storySummary}`,
      icon: <SummarizeOutlined fontSize="small" />,
    });
  }

  if (!items.length) {
    return null;
  }

  return (
    <Box
      component="nav"
      aria-label="Selected hierarchy"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        borderRadius: 2,
        p: 1,
        // backgroundColor: "background.paper",
      }}
    >
      {items.map((item, index) => (
        <Box
          key={item.id}
          component={Link}
          href={item.href}
          title={item.title}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            textDecoration: "none",
            color: "text.primary",
            py: 0.75,
            px: 1,
            borderRadius: 1.5,
            transition: "background-color 0.2s ease",
            ml: index * 2,
            minWidth: 0,
            "&:hover": {
              backgroundColor: "action.hover",
            },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 2,
            },
          }}
        >
          {index > 0 && (
            <SubdirectoryArrowRight
              fontSize="small"
              sx={{ color: "text.disabled" }}
            />
          )}

          {item.avatarUrl ? (
            <Avatar
              src={item.avatarUrl}
              alt={item.label}
              sx={{ width: 20, height: 20 }}
              variant="rounded"
            />
          ) : (
            <Box sx={{ display: "flex", color: "text.secondary" }}>
              {item.icon}
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              flex: 1,
            }}
          >
            <Typography
              variant="body1"
              sx={{ color: "text.secondary", lineHeight: 1.2 }}
            >
              {item.label}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.value}
            </Typography>
          </Box>

          {item.helperText && (
            <Chip
              label={item.helperText}
              size="small"
              variant="outlined"
              sx={{
                height: 20,
                "& .MuiChip-label": { px: 0.75, fontSize: 11 },
              }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
};
