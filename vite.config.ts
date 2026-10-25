import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/ai-coding-dictionary/" : "/",
  plugins: [react()],
  resolve: {
    dedupe: ["three", "postprocessing"],
  },
  optimizeDeps: {
    exclude: ["postprocessing"],
  },
  server: {
    port: 5194,
    strictPort: true,
  },
  test: {
    environment: "node",
  },
}));
