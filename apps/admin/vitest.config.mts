import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const contractsSrc = fileURLToPath(new URL("../../packages/contracts/src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(import.meta.dirname, "src") },
      // Tests consume the contracts' source like the API's do; dist is built by next, not by check.
      { find: /^@mentis\/contracts\/(.+)$/, replacement: `${contractsSrc}/$1/index.ts` },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
