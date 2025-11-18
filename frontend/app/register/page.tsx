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
import { userService } from "@/services/userService";
import { ErrorSnackbar } from "@/components/ErrorSnackbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("token");
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

    setLoading(true);

    try {
      await userService.register({
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
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        p: 2,
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={4}
          sx={{
            p: 4,
            width: "100%",
            borderRadius: 4,
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <LoadingSpinner size={24} /> : "Sign Up"}
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
        <ErrorSnackbar
          open={showError}
          message={error}
          onClose={() => setShowError(false)}
        />
      </Container>
    </Box>
  );
}
