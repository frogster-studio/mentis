import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { EVERY_TIER } from "../common/rate-limit.guard";

// A 429 here would make Railway restart the container, so no tier may ever reach this route.
@Controller("health")
@SkipThrottle(EVERY_TIER)
export class HealthController {
  @Get()
  health(): { status: "ok" } {
    return { status: "ok" };
  }
}
