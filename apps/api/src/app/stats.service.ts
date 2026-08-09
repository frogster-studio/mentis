import { type AppAccountStatsResponse, appAccountStatsResponseSchema } from "@mentis/contracts/app";
import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE } from "../supabase";

const BASELINE_SELECT =
  "device, themeId:theme_id, themeName:theme_name, totalPoints:total_points, sessionCount:session_count";
const SESSION_SELECT = "id, themeId:theme_id, themeName:theme_name, points, finishedAt:finished_at";

@Injectable()
export class StatsService {
  constructor(@Inject(SUPABASE) private readonly supabase: SupabaseClient) {}

  // Owner comes from the verified JWT, never from the request (#6). The
  // explicit owner filters are the RLS owner-scoping, re-implemented API-side.
  async forOwner(ownerId: string): Promise<AppAccountStatsResponse> {
    const [baselines, sessions] = await Promise.all([
      this.supabase.from("stat_baselines").select(BASELINE_SELECT).eq("owner", ownerId),
      this.supabase
        .from("quiz_sessions")
        .select(SESSION_SELECT)
        .eq("owner", ownerId)
        .order("finished_at", { ascending: true }),
    ]);
    if (baselines.error) {
      throw new InternalServerErrorException({
        code: "INTERNAL",
        message: baselines.error.message,
      });
    }
    if (sessions.error) {
      throw new InternalServerErrorException({ code: "INTERNAL", message: sessions.error.message });
    }

    return appAccountStatsResponseSchema.parse({
      baselines: baselines.data ?? [],
      sessions: sessions.data ?? [],
    });
  }
}
