import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const source = dirname(fileURLToPath(import.meta.resolve("@jsquash/webp/package.json")));
const destination = new URL("../public/theme-image-codec/", import.meta.url);
await mkdir(destination, { recursive: true });
for (const name of ["webp_enc.wasm", "webp_enc_simd.wasm"]) {
  await copyFile(join(source, "codec/enc", name), new URL(name, destination));
}
