// src/theme.d.ts or similar file
import "@mui/material/styles";

// 1. Declare custom color options for createTheme
declare module "@mui/material/styles" {
  interface PaletteOptions {
    tertiary?: PaletteColorOptions; // Define the new color name
    successDark?: PaletteColorOptions; // Define another custom color
    sparkle?: PaletteColorOptions; // Define another custom color
  }

  // 2. Declare custom colors on the actual Palette object
  interface Palette {
    tertiary: PaletteColor;
    successDark: PaletteColor;
    sparkle: PaletteColor;
  }

  // 3. Allow custom colors to be used on components (e.g., <Button color="tertiary">)
  interface ButtonPropsColorOverrides {
    tertiary: true;
    successDark: true;
    sparkle: true;
  }
}
