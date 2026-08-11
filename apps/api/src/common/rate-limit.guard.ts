import { type ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import type { AuthedUser } from "../auth/supabase-user.guard";

const WINDOW_MS = 60_000;

type RateLimitTier = { name: string; limit: number };

export const PUBLIC_TIER: RateLimitTier = { name: "public", limit: 60 };
export const DRAW_TIER: RateLimitTier = { name: "draw", limit: 30 };
export const AUTHENTICATED_TIER: RateLimitTier = { name: "authenticated", limit: 120 };

// @SkipThrottle() alone only skips a tier called "default", so the exemption is spelled out per tier.
export const EVERY_TIER: Record<string, boolean> = Object.fromEntries(
  [PUBLIC_TIER, DRAW_TIER, AUTHENTICATED_TIER].map((tier) => [tier.name, true]),
);

abstract class TierThrottlerGuard extends ThrottlerGuard {
  protected abstract readonly tier: RateLimitTier;

  // Each guard carries its own tier, because a module-wide one would apply every tier to every route.
  override async onModuleInit(): Promise<void> {
    await super.onModuleInit();
    this.throttlers = [
      { name: this.tier.name, limit: this.tier.limit, ttl: WINDOW_MS, setHeaders: false },
    ];
  }

  // The library keys per handler, which would hand every route in a tier its own allowance.
  protected override generateKey(_context: ExecutionContext, tracker: string): string {
    return `${this.tier.name}:${tracker}`;
  }

  protected override async throwThrottlingException(): Promise<void> {
    throw new HttpException(
      { code: "RATE_LIMITED", message: "Too many requests" },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

@Injectable()
export class PublicThrottlerGuard extends TierThrottlerGuard {
  protected readonly tier = PUBLIC_TIER;
}

@Injectable()
export class DrawThrottlerGuard extends TierThrottlerGuard {
  protected readonly tier = DRAW_TIER;
}

@Injectable()
export class AuthenticatedThrottlerGuard extends TierThrottlerGuard {
  protected readonly tier = AUTHENTICATED_TIER;

  // Ordered after the auth guard, so the bucket key is a verified sub and never a forgeable one.
  protected override async getTracker(request: Record<string, unknown>): Promise<string> {
    const user = request.user as AuthedUser | undefined;
    if (user === undefined) {
      throw new Error("Authenticated throttling needs an auth guard ahead of it");
    }
    return user.id;
  }
}
