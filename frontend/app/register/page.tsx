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
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRegisterMutation } from "@/hooks/queries/useUserQueries";
import { AppSnackbar } from "@/components/AppSnackbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { getToken } from "@/utils/jwtUtils";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { mutateAsync: register, isPending: isRegisterPending } =
    useRegisterMutation();
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const token = getToken();
    if (token) {
      router.push("/chat");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setShowError(true);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setShowError(true);
      return;
    }

    try {
      await register({
        username,
        email: email || undefined,
        password,
      });
      router.push("/login");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Registration failed. Please try again.";
      setError(errorMessage);
      setShowError(true);
    } finally {
      // Loading handled by mutation
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
            Sign Up
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isRegisterPending}
            />
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Email (Optional)"
              name="email"
              autoComplete="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isRegisterPending}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isRegisterPending}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isRegisterPending}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isRegisterPending}
            >
              {isRegisterPending ? <LoadingSpinner size={24} /> : "Sign Up"}
            </Button>
            <Box textAlign="center">
              <Link href="/login" passHref>
                <MuiLink component="span" variant="body2">
                  Already have an account? Sign In
                </MuiLink>
              </Link>
            </Box>
          </Box>
        </Paper>
        <AppSnackbar
          open={showError}
          message={error}
          onClose={() => setShowError(false)}
        />
      </Container>
    </Box>
  );
}
