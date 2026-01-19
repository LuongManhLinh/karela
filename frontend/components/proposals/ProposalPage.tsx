import { Box, Typography } from "@mui/material";

export default function ProposalPage() {
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Typography color="text.secondary" variant="h5">
          Select a proposal to view details.
        </Typography>
      </Box>
    </Box>
  );
}
