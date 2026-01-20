import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";

export const ConnectionNotFound = () => {
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
        Connection Not Found
      </Typography>
      <Typography variant="body1">
        The connection you are looking for does not exist or you do not have permission to view it.
      </Typography>
      <Button variant="contained" onClick={() => router.push("/app")}>
        Go to Dashboard
      </Button>
    </Box>
  );
};
