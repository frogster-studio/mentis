import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { ENV, type Env } from "../../_config/env.config";
import { RevenueCatResyncService } from "../services/revenuecat-resync.service";
import { constantTimeEqual } from "../utils/constant-time-equal";

@Controller("revenuecat/webhook")
export class RevenueCatWebhookController {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly revenueCatResyncService: RevenueCatResyncService,
  ) {}

  // A forged body can only trigger a resync from RevenueCat's own state, so it is acknowledged.
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async webhook(@Req() request: Request, @Body() body: unknown): Promise<void> {
    const header = request.headers.authorization ?? "";
    if (!constantTimeEqual(header, this.env.REVENUECAT_WEBHOOK_AUTH)) {
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "Invalid webhook authorization",
      });
    }
    await this.revenueCatResyncService.handleDelivery(body);
  }
}
