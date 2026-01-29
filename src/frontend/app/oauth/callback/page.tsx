"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Box, CircularProgress, Typography, Button, useTheme } from "@mui/material";

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const theme = useTheme();

  const status = searchParams.get("status");

  useEffect(() => {
    // If we have code and state but no status, it might be an old link or manual navigation?
    // But the backend redirects with status.
    // If status is present, we show the UI.
    if (!status && searchParams.get("code")) {
       // Wait for backend redirect logic if somehow the user landed here directly (unlikely with backend redirect)
    }
  }, [searchParams, status]);

  const handleGoHome = () => {
    router.push("/profile");
  };

  const handleGoChat = () => {
     router.push("/chat");
  }

  if (status === "success" || status === "update") {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          gap: 3,
          p: 2,
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            fontSize: "80px",
            color: theme.palette.success.main,
            animation: "bounce 0.6s ease-out",
            "@keyframes bounce": {
              "0%": { transform: "scale(0)" },
              "50%": { transform: "scale(1.1)" },
              "100%": { transform: "scale(1)" },
            },
          }}
        >
          ✅
        </Box>
        <Typography variant="h4" sx={{ color: theme.palette.success.dark, fontWeight: 700 }}>
          {status === "success" ? "All Set!" : "Updated!"}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
          Your Jira connection has been successfully {status === "success" ? "established" : "updated"}. You're all ready to go!
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={handleGoHome}>
            Return to Profile
            </Button>
            <Button variant="outlined" color="primary" onClick={handleGoChat}>
            Go to Chat
            </Button>
        </Box>
      </Box>
    );
  }

  if (status === "failure") {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          gap: 3,
          p: 2,
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            fontSize: "80px",
            color: theme.palette.error.main,
            animation: "shake 0.5s ease-in-out",
            "@keyframes shake": {
                 "0%, 100%": { transform: "translateX(0)" },
                 "25%": { transform: "translateX(-10px)" },
                 "75%": { transform: "translateX(10px)" }
            }
          }}
        >
          ❌
        </Box>
        <Typography variant="h4" sx={{ color: theme.palette.error.dark, fontWeight: 700 }}>
          Something Went Wrong
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
          We couldn't connect to your Jira account. Please try again or contact support if the problem persists.
        </Typography>
        <Button variant="contained" color="error" onClick={handleGoHome}>
          Return to Profile
        </Button>
      </Box>
    );
  }

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
      <Typography variant="body1">Processing Connection...</Typography>
    </Box>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <OAuthCallbackContent />
    </Suspense>
  );
}

