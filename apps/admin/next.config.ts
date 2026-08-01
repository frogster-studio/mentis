import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Parallel sessions share this worktree; a second dev server needs its own
  // dist dir to escape the single-instance lock on .next/dev.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
