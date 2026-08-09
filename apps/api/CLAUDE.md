# apps/api — WALKING SKELETON (prototype)

Born as the wayfinder #8 prototype: throwaway everywhere **except** the decisions it validates —
module layout (surface directories mirror the `/admin` + `/app` URL namespaces), zod contracts
wired from `@mentis/contracts`, and the bun/tsc/vitest/Docker toolchain.

**The auth guards are STUBS**: they decode JWTs without verifying signatures. Real verification
(jose + JWKS, pinned iss/aud/alg) lands with the implementation issues once the ES256 signing-key
migration is done — see issue #4. Do not ship anything user-facing from this state.

- `bun run dev` — watch mode via bun (auto-loads `.env`; see `.env.example`)
- `bun run typecheck` / `bun run test` — tsc + vitest (SWC transform for decorator metadata)
- `bun run build` — tsc emit to `dist/`, executed by node in prod (Docker)
- Decorator flags live directly in `tsconfig.json` — never move them into a shared base
  (bun bug oven-sh/bun#6326).
