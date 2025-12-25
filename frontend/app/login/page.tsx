"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link as MuiLink,
  Alert,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/hooks/queries/useUserQueries";
import { ErrorSnackbar } from "@/components/ErrorSnackbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { getToken, saveToken } from "@/utils/jwt_utils";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { mutateAsync: login, isPending: isLoginPending } = useLoginMutation();
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  const theme = useTheme();

  useEffect(() => {
    // Check if already logged in
    const token = getToken();
    if (token) {
      router.push("/analysis");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowError(false);

    try {
      const response = await login({
        username_or_email: username,
        password,
      });

      if (response.data) {
        saveToken(response.data);
        router.push("/analysis");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Login failed. Please try again.";
      setError(errorMessage);
      setShowError(true);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
        gap: 2,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 32,
          left: 32,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component="img"
          src="logo.svg"
          alt="Logo"
          sx={{ height: 40, mr: 1 }}
        />
        <Typography variant="h5" fontWeight="bold">
          {" "}
          Karela
        </Typography>
      </Box>
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={4}
          sx={{
            p: 4,
            width: "100%",
            borderRadius: 2,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontWeight: 700, mb: 3 }}
          >
            Sign In
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username or Email"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoginPending}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoginPending}
            />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoginPending}
              >
                {isLoginPending ? <LoadingSpinner size={24} /> : "Sign In"}
              </Button>
            <Box textAlign="center">
              <Link href="/register" passHref>
                <MuiLink component="span" variant="body2">
                  Don't have an account? Sign Up
                </MuiLink>
              </Link>
            </Box>
          </Box>
        </Paper>
        <ErrorSnackbar
          open={showError}
          message={error}
          onClose={() => setShowError(false)}
        />
      </Container>
    </Box>
  );
}
