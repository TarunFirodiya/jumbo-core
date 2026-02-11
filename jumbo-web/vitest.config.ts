import { defineConfig } from "vitest/config";
import path from "path";
import { config } from "dotenv";

// Load .env.local BEFORE any test imports resolve
config({ path: ".env.local" });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.spec.ts", "tests/**/*.test.ts"],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
