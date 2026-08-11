import {
  type AppQuestionDrawQuery,
  type AppQuestionDrawResponse,
  appQuestionDrawQuerySchema,
  appQuestionDrawResponseSchema,
} from "@mentis/contracts/app";
import { Controller, Get, Inject, NotFoundException, Query, UseGuards } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DrawThrottlerGuard } from "../common/rate-limit.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SUPABASE } from "../supabase";

const DRAW_SELECT =
  "id, themeId:theme_id, themeName:theme_name, text, answer, aliases, misspellings, wrongChoices:wrong_choices";

@Controller("app/questions")
@UseGuards(DrawThrottlerGuard)
export class QuestionsController {
  constructor(@Inject(SUPABASE) private readonly supabase: SupabaseClient) {}

  @Get()
  async draw(
    @Query(new ZodValidationPipe(appQuestionDrawQuerySchema)) query: AppQuestionDrawQuery,
  ): Promise<AppQuestionDrawResponse> {
    // An unknown Theme and a Theme with no Questions both draw nothing, so the 404 is decided first.
    if (query.theme !== undefined) {
      await this.assertThemeExists(query.theme);
    }
    const { data, error } = await this.supabase
      .rpc("get_random_questions", { theme_slug: query.theme ?? null, n: query.n })
      .select(DRAW_SELECT);
    if (error) {
      throw new Error(`question draw failed: ${error.message}`);
    }
    return appQuestionDrawResponseSchema.parse(data ?? []);
  }

  private async assertThemeExists(theme: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("themes")
      .select("id")
      .eq("id", theme)
      .maybeSingle();
    if (error) {
      throw new Error(`theme lookup failed: ${error.message}`);
    }
    if (data === null) {
      throw new NotFoundException({ code: "THEME_NOT_FOUND", message: `Unknown theme: ${theme}` });
    }
  }
}
