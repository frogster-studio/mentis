# Build context = repo root (Railway: RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile, healthcheck /health).

# ---- manifests: the cached install layer both later bun stages start from ----
FROM oven/bun:1.3 AS manifests
WORKDIR /repo
COPY package.json bun.lock ./
# Every workspace manifest, because --frozen-lockfile validates all of them.
COPY apps/api/package.json apps/api/
COPY apps/admin/package.json apps/admin/
COPY apps/mobile/package.json apps/mobile/
COPY packages/contracts/package.json packages/contracts/

# ---- build: bun installs the workspace, tsc emits contracts then api ----
FROM manifests AS build
RUN bun install --frozen-lockfile --filter @mentis/api --filter @mentis/contracts
COPY packages/contracts packages/contracts
COPY apps/api apps/api
# node runs tsc-compiled output only; bun's transpiler never touches prod code
RUN cd packages/contracts && bun --bun run build
RUN cd apps/api && bun --bun run build

# ---- prod-deps: production dependency tree only ----
FROM manifests AS prod-deps
RUN bun install --frozen-lockfile --production --filter @mentis/api --filter @mentis/contracts

# ---- runtime: node LTS, non-root, dist + prod deps only ----
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /repo
# isolated-linker layout: the .bun store plus each workspace's symlink farm
COPY --from=prod-deps --chown=node:node /repo/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=prod-deps --chown=node:node /repo/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=build --chown=node:node /repo/packages/contracts/dist ./packages/contracts/dist
COPY --from=build --chown=node:node /repo/packages/contracts/package.json ./packages/contracts/
COPY --from=build --chown=node:node /repo/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /repo/apps/api/package.json ./apps/api/
USER node
EXPOSE 3001
# Railway injects PORT; main.ts binds 0.0.0.0
CMD ["node", "apps/api/dist/main.js"]
