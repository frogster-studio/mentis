import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const answerMatchingSrc = fileURLToPath(
  new URL("../../packages/answer-matching/src/index.ts", import.meta.url),
);
const contractsSrc = fileURLToPath(new URL("../../packages/contracts/src", import.meta.url));
const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: [
      // The workspace packages are source-first: Metro reads them through the `react-native` export
      // condition, and node — which matches neither that nor `bun` — needs the same source here.
      { find: /^@mentis\/contracts\/(.+)$/, replacement: `${contractsSrc}/$1/index.ts` },
      { find: "@mentis/answer-matching", replacement: answerMatchingSrc },
      // Metro reads this one from tsconfig paths; vitest needs it spelled out.
      { find: /^@\/(.+)$/, replacement: `${src}/$1` },
    ],
  },
});
