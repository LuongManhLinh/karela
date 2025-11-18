"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  ThemeProvider as MUIThemeProvider,
  createTheme,
  CssBaseline,
  PaletteMode,
} from "@mui/material";

type ThemeContextType = {
  mode: PaletteMode;
  toggleColorMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setMode] = useState<PaletteMode>("light");

  useEffect(() => {
    // Load theme preference from localStorage
    const savedMode = localStorage.getItem("themeMode") as PaletteMode;
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  const toggleColorMode = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("themeMode", newMode);
  };

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: "#667eea",
        light: "#8b9ef0",
        dark: "#4a5fd4",
      },
      secondary: {
        main: "#764ba2",
        light: "#9268b8",
        dark: "#5a3788",
      },
      success: {
        main: mode === "light" ? "#48bb78" : "#68d391",
        light: mode === "light" ? "#68d391" : "#9ae6b4",
        dark: mode === "light" ? "#38a169" : "#48bb78",
      },
      error: {
        main: mode === "light" ? "#f56565" : "#fc8181",
        light: mode === "light" ? "#fc8181" : "#f5a5a5",
        dark: mode === "light" ? "#e53e3e" : "#f56565",
      },
      background: {
        default: mode === "light" ? "#f8f9fa" : "#1a202c",
        paper: mode === "light" ? "#ffffff" : "#2d3748",
      },
      text: {
        primary: mode === "light" ? "#2d3748" : "#f7fafc",
        secondary: mode === "light" ? "#718096" : "#cbd5e0",
      },
    },
    shape: {
      borderRadius: 16,
    },
    shadows: [
      "none",
      "0 2px 8px rgba(0, 0, 0, 0.08)",
      "0 4px 16px rgba(0, 0, 0, 0.12)",
      "0 8px 24px rgba(0, 0, 0, 0.16)",
      "0 12px 32px rgba(0, 0, 0, 0.20)",
      "0 20px 60px rgba(0, 0, 0, 0.15)",
      ...Array(19).fill("none"),
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: 12,
            padding: "10px 24px",
            fontWeight: 600,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
            },
          },
          contained: {
            background:
              mode === "light"
                ? "linear-gradient(135deg,rgb(200, 206, 235) 0%,rgb(204, 177, 234) 100%)"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "&:hover": {
              background:
                mode === "light"
                  ? "linear-gradient(135deg, #5a6fd8 0%, #6a3f92 100%)"
                  : "linear-gradient(135deg, #5a6fd8 0%, #6a3f92 100%)",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            backgroundImage: "none",
          },
          elevation1: {
            boxShadow:
              mode === "light"
                ? "0 2px 8px rgba(0, 0, 0, 0.08)"
                : "0 2px 8px rgba(0, 0, 0, 0.3)",
          },
          elevation2: {
            boxShadow:
              mode === "light"
                ? "0 4px 16px rgba(0, 0, 0, 0.12)"
                : "0 4px 16px rgba(0, 0, 0, 0.4)",
          },
          elevation3: {
            boxShadow:
              mode === "light"
                ? "0 8px 24px rgba(0, 0, 0, 0.16)"
                : "0 8px 24px rgba(0, 0, 0, 0.5)",
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 12,
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#667eea",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#667eea",
                borderWidth: 2,
              },
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow:
              mode === "light"
                ? "0 2px 8px rgba(0, 0, 0, 0.08)"
                : "0 2px 8px rgba(0, 0, 0, 0.3)",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ mode, toggleColorMode }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
