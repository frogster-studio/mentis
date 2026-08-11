import { createRemoteJWKSet, type JWTVerifyGetKey } from "jose";
import type { Env } from "../env";

export const JWKS = Symbol("JWKS");

// Cached in-process, so verifying a request never hops to the Auth server.
export const createProjectJwks = (env: Env): JWTVerifyGetKey =>
  createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`));
