import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  base: "", // for relative asset paths
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
