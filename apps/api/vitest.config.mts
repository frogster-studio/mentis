import { fileURLToPath } from "node:url";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

const answerMatchingSrc = fileURLToPath(
  new URL("../../packages/answer-matching/src/index.ts", import.meta.url),
);
const contractsSrc = fileURLToPath(new URL("../../packages/contracts/src", import.meta.url));

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts", "test/**/*.e2e-spec.ts"],
  },
  resolve: {
    alias: [
      // Tests consume the packages' source like bun dev does; dist is built only inside the Docker image.
      { find: /^@mentis\/contracts\/(.+)$/, replacement: `${contractsSrc}/$1/index.ts` },
      { find: "@mentis/answer-matching", replacement: answerMatchingSrc },
    ],
  },
  plugins: [
    // vitest's default esbuild transform cannot emit decorator metadata; SWC can.
    swc.vite({ module: { type: "es6" } }),
  ],
});
