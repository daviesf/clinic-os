import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import esToolkitPlugin from "vite-plugin-es-toolkit";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), esToolkitPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
