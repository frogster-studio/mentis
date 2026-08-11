import { type AppThemeListResponse, appThemeListResponseSchema } from "@mentis/contracts/app";
import { Controller, Get, Inject } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE } from "../supabase";

// PostgREST returns an embedded aggregate as a one-row array, so questionCount folds here.
type ThemeCountRow = { id: string; name: string; questions: { count: number }[] };

@Controller("app/themes")
export class ThemesController {
  constructor(@Inject(SUPABASE) private readonly supabase: SupabaseClient) {}

  @Get()
  async list(): Promise<AppThemeListResponse> {
    const { data, error } = await this.supabase.from("themes").select("id, name, questions(count)");
    if (error) {
      throw new Error(`themes select failed: ${error.message}`);
    }
    const rows = (data ?? []) as ThemeCountRow[];
    return appThemeListResponseSchema.parse(
      rows.map(({ id, name, questions }) => ({
        id,
        name,
        questionCount: questions[0]?.count ?? 0,
      })),
    );
  }
}
