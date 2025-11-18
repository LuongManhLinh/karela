"use client";

import React, { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code && state) {
      // The backend handles the OAuth callback
      // After successful OAuth, redirect to chat
      // The backend should have saved the connection by now
      setTimeout(() => {
        router.push("/chat");
      }, 2000);
    } else {
      // Missing parameters, redirect to login
      router.push("/login");
    }
  }, [searchParams, router]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body1">
        Completing Jira connection...
      </Typography>
    </Box>
  );
}

