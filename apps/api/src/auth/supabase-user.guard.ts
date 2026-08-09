import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

export interface AuthedUser {
  id: string;
  email: string | undefined;
  claims: Record<string, unknown>;
}

export type AuthedRequest = Request & { user: AuthedUser };

// ── PROTOTYPE STUB ──────────────────────────────────────────────────────────
// Decodes the JWT payload WITHOUT verifying the signature; it only enforces the
// claim shape #4 pinned (string `sub`, role === "authenticated"). The real
// guard replaces the decode with jose `jwtVerify` against the project JWKS
// (pinned iss / aud / alg) once the ES256 signing-key migration lands — see #4.
// The 401 contract and the request.user shape (#7) are the real thing.
// ────────────────────────────────────────────────────────────────────────────
@Injectable()
export class SupabaseUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) {
      throw new UnauthorizedException({ code: "UNAUTHENTICATED", message: "Missing bearer token" });
    }

    const claims = decodeJwtPayloadUnverified(token);
    if (!claims || typeof claims.sub !== "string" || claims.role !== "authenticated") {
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "Invalid or expired token",
      });
    }

    request.user = {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : undefined,
      claims,
    };
    return true;
  }
}

const decodeJwtPayloadUnverified = (token: string): Record<string, unknown> | undefined => {
  const segments = token.split(".");
  if (segments.length !== 3) return undefined;
  try {
    const decoded: unknown = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8"));
    return typeof decoded === "object" && decoded !== null
      ? (decoded as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
};
