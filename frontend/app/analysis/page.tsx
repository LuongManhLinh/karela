import type { Metadata } from "next";
import { Box, Typography } from "@mui/material";

export const metadata: Metadata = {
  title: "Karela Analysis",
  description: "Karela Analyze page description",
};

export default function ChatPage() {
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
          Select an analysis to view details.
        </Typography>
      </Box>
    </Box>
  );
}
