import type { SupabaseClient } from "@supabase/supabase-js";

const THEME_COUNT_SELECT = "id, name, questions(count)";

// PostgREST returns an embedded aggregate as a one-row array, so questionCount folds here.
type ThemeCountRow = { id: string; name: string; questions: { count: number }[] };

export type ThemeWithCount = { id: string; name: string; questionCount: number };

export const readThemesWithCounts = async (supabase: SupabaseClient): Promise<ThemeWithCount[]> => {
  const { data, error } = await supabase.from("themes").select(THEME_COUNT_SELECT);
  if (error) {
    throw new Error(`themes select failed: ${error.message}`);
  }
  return (data as ThemeCountRow[]).map(({ id, name, questions }) => ({
    id,
    name,
    questionCount: questions[0]?.count ?? 0,
  }));
};
