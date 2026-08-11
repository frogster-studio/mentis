import { Controller, Get } from "@nestjs/common";

// Unguarded and unthrottled by design: Railway's healthcheck target.
@Controller("health")
export class HealthController {
  @Get()
  health(): { status: "ok" } {
    return { status: "ok" };
  }
}
