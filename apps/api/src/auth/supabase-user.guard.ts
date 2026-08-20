import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { type JWTPayload, type JWTVerifyGetKey, jwtVerify } from "jose";
import { ENV, type Env } from "../_config/env.config";
import { JWKS } from "./jwks";

export interface AuthedUser {
  id: string;
  email: string | undefined;
  claims: JWTPayload;
}

export type AuthedRequest = Request & { user: AuthedUser };

const unauthenticated = (message: string): UnauthorizedException =>
  new UnauthorizedException({ code: "UNAUTHENTICATED", message });

@Injectable()
export class SupabaseUserGuard implements CanActivate {
  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(JWKS) private readonly jwks: JWTVerifyGetKey,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    // RFC 7235 makes the scheme case-insensitive, so a lowercase "bearer" is a real token, not a miss.
    const token = request.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (token === undefined) {
      throw unauthenticated("Missing bearer token");
    }

    const claims = await this.verify(token);
    // A valid signature is not authentication: the legacy anon key is itself a validly signed JWT.
    if (typeof claims.sub !== "string" || claims.role !== "authenticated") {
      throw unauthenticated("Not an authenticated user token");
    }

    request.user = {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : undefined,
      claims,
    };
    return true;
  }

  private async verify(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: `${this.env.SUPABASE_URL}/auth/v1`,
        audience: "authenticated",
        algorithms: ["ES256"],
      });
      return payload;
    } catch {
      throw unauthenticated("Invalid or expired token");
    }
  }
}
