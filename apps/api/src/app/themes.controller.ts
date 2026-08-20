import { type AppThemeListResponse, appThemeListResponseSchema } from "@mentis/contracts/app";
import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PublicThrottlerGuard } from "../common/rate-limit.guard";
import { SUPABASE } from "../supabase";
import { readThemesWithCounts } from "./theme-counts";

@Controller("app/themes")
@UseGuards(PublicThrottlerGuard)
export class ThemesController {
  constructor(@Inject(SUPABASE) private readonly supabase: SupabaseClient) {}

  @Get()
  async list(): Promise<AppThemeListResponse> {
    return appThemeListResponseSchema.parse(await readThemesWithCounts(this.supabase));
  }
}
