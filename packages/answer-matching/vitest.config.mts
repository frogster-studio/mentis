import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const contractsSrc = fileURLToPath(new URL("../contracts/src", import.meta.url));

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
  },
  resolve: {
    alias: [
      // Tests consume the contracts source like bun dev does; dist is built only inside the Docker image.
      { find: /^@mentis\/contracts\/(.+)$/, replacement: `${contractsSrc}/$1/index.ts` },
    ],
  },
});
