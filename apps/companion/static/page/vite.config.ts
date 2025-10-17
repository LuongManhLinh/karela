import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Add this babel config
      babel: {
        plugins: [
          "@atlaskit/tokens/babel-plugin",
          [
            "@compiled/babel-plugin", // This is the correct package
            {
              // This is the CRITICAL part for Atlaskit
              importSources: ["@atlaskit/primitives", "@atlaskit/css"],
            },
          ],
        ],
      },
    }),
  ],
  // define: {
  //   // Provide the 'process' object to the browser
  //   "process.env": {},
  //   // For certain specific cases, you might need to also define other globals
  //   // 'process': {},
  // },
  // optimizeDeps: {
  //   // Add packages that cause issues here
  //   exclude: ["@atlaskit/primitives", "@atlaskit/css"],
  // },
  base: "", // for relative asset paths
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
  server: {
    port: 5173,
  },
});
