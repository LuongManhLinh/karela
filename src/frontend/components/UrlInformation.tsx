import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { Box, Typography } from "@mui/material";
import Link from "next/link";

export const UrlInformation: React.FC = () => {
  const { urlSelectedConnection, urlSelectedProject, urlSelectedStory } =
    useWorkspaceStore();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {urlSelectedConnection && (
        <Box
          sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
          component={Link}
          color="inherit"
          href={`/app/connections/${urlSelectedConnection.name}`}
          title={urlSelectedConnection.name}
        >
          <Box
            src={urlSelectedConnection.avatar_url}
            component="img"
            alt="icon"
            sx={{ width: 20, height: 20, mr: 1 }}
          />
          <Typography variant="h6">{urlSelectedConnection.name}</Typography>
        </Box>
      )}
      {urlSelectedConnection && urlSelectedProject && (
        <Box
          sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
          component={Link}
          color="inherit"
          href={`/app/connections/${urlSelectedConnection.name}/projects/${urlSelectedProject.key}`}
          title={urlSelectedProject.name}
        >
          <Box
            src={urlSelectedProject.avatar_url}
            component="img"
            alt="icon"
            sx={{ width: 20, height: 20, mr: 1 }}
          />
          <Typography variant="subtitle1">
            {urlSelectedProject.key} - {urlSelectedProject.name}
          </Typography>
        </Box>
      )}
      {urlSelectedConnection && urlSelectedProject && urlSelectedStory && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
          }}
          component={Link}
          color="inherit"
          href={`/app/connections/${urlSelectedConnection.name}/projects/${urlSelectedProject.key}/stories/${urlSelectedStory.key}`}
          title={`${urlSelectedStory.key} - ${urlSelectedStory.summary || ""}`}
        >
          <Typography variant="body1">
            {urlSelectedStory.key} - {urlSelectedStory.summary || ""}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
