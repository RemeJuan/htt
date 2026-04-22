import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.ts"],
      exclude: [
        "**/*.d.ts",
        "lib/database.types.ts",
        "tests/**",
      ],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.{test,spec}.ts"],
          setupFiles: ["tests/setup/shared.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          environment: "happy-dom",
          include: [
            "tests/components/**/*.{test,spec}.tsx",
            "tests/smoke/**/*.{test,spec}.tsx",
          ],
          setupFiles: ["tests/setup/shared.ts", "tests/setup/happy-dom.tsx", "tests/setup/a11y.ts"],
        },
      },
    ],
  },
});
