import { Stack, Typography, Chip } from "@mui/material";

export interface HeaderContentProps {
  headerText?: string;
  headerProjectKey?: string;
  headerStoryKey?: string;
}

const HeaderContent: React.FC<HeaderContentProps> = ({
  headerText,
  headerProjectKey,
  headerStoryKey,
}) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      justifyContent="flex-start"
      sx={{
        width: "auto",
        py: 2,
        flex: "0 0 auto",
      }}
    >
      <Typography
        variant="h6"
        component="div"
        sx={{ userSelect: "none", whiteSpace: "nowrap" }}
      >
        {headerText || "Workspace"}
      </Typography>
      {headerProjectKey && <Chip label={headerProjectKey} color="primary" />}
      {headerStoryKey && <Chip label={headerStoryKey} color="secondary" />}
    </Stack>
  );
};

export default HeaderContent;
