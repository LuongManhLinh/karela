// src/theme.d.ts or similar file
import "@mui/material/styles";

// 1. Declare custom color options for createTheme
declare module "@mui/material/styles" {
  interface PaletteOptions {
    tertiary?: PaletteColorOptions;
    surfaceTint?: string;
    onPrimary?: string;
    primaryContainer?: string;
    onPrimaryContainer?: string;
    onSecondary?: string;
    secondaryContainer?: string;
    onSecondaryContainer?: string;
    onTertiary?: string;
    tertiaryContainer?: string;
    onTertiaryContainer?: string;
    onError?: string;
    errorContainer?: string;
    onErrorContainer?: string;
    onBackground?: string;
    onSurface?: string;
    surfaceVariant?: string;
    onSurfaceVariant?: string;
    outlineVariant?: string;
    shadow?: string;
    scrim?: string;
    inverseSurface?: string;
    inverseOnSurface?: string;
    inversePrimary?: string;
    primaryFixed?: string;
    onPrimaryFixed?: string;
    primaryFixedDim?: string;
    onPrimaryFixedVariant?: string;
    secondaryFixed?: string;
    onSecondaryFixed?: string;
    secondaryFixedDim?: string;
    onSecondaryFixedVariant?: string;
    tertiaryFixed?: string;
    onTertiaryFixed?: string;
    tertiaryFixedDim?: string;
    onTertiaryFixedVariant?: string;
    surfaceDim?: string;
    surfaceBright?: string;
    surfaceContainerLowest?: string;
    surfaceContainerLow?: string;
    surfaceContainer?: string;
    surfaceContainerHigh?: string;
    surfaceContainerHighest?: string;
  }

  // 2. Declare custom colors on the actual Palette object
  interface Palette {
    tertiary: PaletteColor;
    surfaceTint: string;
    onPrimary: string;
    primaryContainer: string;
    onPrimaryContainer: string;
    onSecondary: string;
    secondaryContainer: string;
    onSecondaryContainer: string;
    onTertiary: string;
    tertiaryContainer: string;
    onTertiaryContainer: string;
    onError: string;
    errorContainer: string;
    onErrorContainer: string;
    onBackground: string;
    onSurface: string;
    surfaceVariant: string;
    onSurfaceVariant: string;
    outlineVariant: string;
    shadow: string;
    scrim: string;
    inverseSurface: string;
    inverseOnSurface: string;
    inversePrimary: string;
    primaryFixed: string;
    onPrimaryFixed: string;
    primaryFixedDim: string;
    onPrimaryFixedVariant: string;
    secondaryFixed: string;
    onSecondaryFixed: string;
    secondaryFixedDim: string;
    onSecondaryFixedVariant: string;
    tertiaryFixed: string;
    onTertiaryFixed: string;
    tertiaryFixedDim: string;
    onTertiaryFixedVariant: string;
    surfaceDim: string;
    surfaceBright: string;
    surfaceContainerLowest: string;
    surfaceContainerLow: string;
    surfaceContainer: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;
  }

  // 3. Allow custom colors to be used on components (e.g., <Button color="tertiary">)
  interface ButtonPropsColorOverrides {
    tertiary: true;
  }
}
