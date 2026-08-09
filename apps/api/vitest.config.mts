import { fileURLToPath } from "node:url";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

const contractsSrc = fileURLToPath(new URL("../../packages/contracts/src", import.meta.url));

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts", "test/**/*.e2e-spec.ts"],
  },
  resolve: {
    alias: [
      // Tests consume contracts source exactly like bun dev does; dist stays a
      // prod-only artifact built inside the Docker image.
      { find: /^@mentis\/contracts\/(.+)$/, replacement: `${contractsSrc}/$1/index.ts` },
    ],
  },
  plugins: [
    // vitest's default esbuild transform cannot emit decorator metadata; SWC can.
    swc.vite({ module: { type: "es6" } }),
  ],
});
