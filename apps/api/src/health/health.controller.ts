import { Controller, Get } from "@nestjs/common";

// Unguarded by design (#6): Railway's healthcheck target.
@Controller("health")
export class HealthController {
  @Get()
  health(): { status: "ok" } {
    return { status: "ok" };
  }
}
