import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";

export const ProjectNotFound = () => {
  const router = useRouter();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      gap={2}
    >
      <Typography variant="h5" color="error">
        Project Not Found
      </Typography>
      <Typography variant="body1">
        The project you are looking for does not exist in this connection.
      </Typography>
      <Button variant="contained" onClick={() => router.back()}>
        Go Back
      </Button>
    </Box>
  );
};
