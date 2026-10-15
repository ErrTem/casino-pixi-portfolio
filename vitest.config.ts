import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["math/**/*.test.ts", "client/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
