"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  ThemeProvider as MUIThemeProvider,
  createTheme,
  CssBaseline,
  PaletteMode,
} from "@mui/material";

import themeData from "@/material-theme.json";

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

  const scheme = themeData.schemes[mode];

  const theme = createTheme({
    typography: {
      fontFamily: `"Nunito", "Roboto", "Helvetica", "Arial", sans-serif`,
    },
    shape: {
      borderRadius: 8,
    },

    palette: {
      mode,
      primary: {
        main: scheme.primary,
        contrastText: scheme.onPrimary,
      },
      secondary: {
        main: scheme.secondary,
        contrastText: scheme.onSecondary,
      },
      tertiary: {
        main: scheme.tertiary,
        contrastText: scheme.onTertiary,
      },
      error: {
        main: scheme.error,
        contrastText: scheme.onError,
      },
      background: {
        default: scheme.background,
        paper: scheme.surfaceContainer,
      },
      text: {
        primary: scheme.onSurface,
        secondary: scheme.onSurfaceVariant,
      },
      surfaceTint: scheme.surfaceTint,
      onPrimary: scheme.onPrimary,
      primaryContainer: scheme.primaryContainer,
      onPrimaryContainer: scheme.onPrimaryContainer,
      onSecondary: scheme.onSecondary,
      secondaryContainer: scheme.secondaryContainer,
      onSecondaryContainer: scheme.onSecondaryContainer,
      onTertiary: scheme.onTertiary,
      tertiaryContainer: scheme.tertiaryContainer,
      onTertiaryContainer: scheme.onTertiaryContainer,
      onError: scheme.onError,
      errorContainer: scheme.errorContainer,
      onErrorContainer: scheme.onErrorContainer,
      onBackground: scheme.onBackground,
      onSurface: scheme.onSurface,
      surfaceVariant: scheme.surfaceVariant,
      onSurfaceVariant: scheme.onSurfaceVariant,
      outlineVariant: scheme.outlineVariant,
      shadow: scheme.shadow,
      scrim: scheme.scrim,
      inverseSurface: scheme.inverseSurface,
      inverseOnSurface: scheme.inverseOnSurface,
      inversePrimary: scheme.inversePrimary,
      primaryFixed: scheme.primaryFixed,
      onPrimaryFixed: scheme.onPrimaryFixed,
      primaryFixedDim: scheme.primaryFixedDim,
      onPrimaryFixedVariant: scheme.onPrimaryFixedVariant,
      secondaryFixed: scheme.secondaryFixed,
      onSecondaryFixed: scheme.onSecondaryFixed,
      secondaryFixedDim: scheme.secondaryFixedDim,
      onSecondaryFixedVariant: scheme.onSecondaryFixedVariant,
      tertiaryFixed: scheme.tertiaryFixed,
      onTertiaryFixed: scheme.onTertiaryFixed,
      tertiaryFixedDim: scheme.tertiaryFixedDim,
      onTertiaryFixedVariant: scheme.onTertiaryFixedVariant,
      surfaceDim: scheme.surfaceDim,
      surfaceBright: scheme.surfaceBright,
      surfaceContainerLowest: scheme.surfaceContainerLowest,
      surfaceContainerLow: scheme.surfaceContainerLow,
      surfaceContainer: scheme.surfaceContainer,
      surfaceContainerHigh: scheme.surfaceContainerHigh,
      surfaceContainerHighest: scheme.surfaceContainerHighest,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: 12,
            padding: "8px 16px",
            fontWeight: 600,
            boxShadow: "none",
            "&:hover": {
              boxShadow: `0 4px 12px ${scheme.shadow}`,
            },
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
