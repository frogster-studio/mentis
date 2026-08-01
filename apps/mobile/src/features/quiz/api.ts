import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Question, ThemeWithCount } from "@/types/quiz";

export const quizKeys = {
  themes: ["quiz", "themes"] as const,
  sessionQuestions: (themeId: string) => ["quiz", "session-questions", themeId] as const,
};

// Shape returned by PostgREST for `questions(count)` (aggregate embed over the
// themes→questions foreign key).
type ThemeCountRow = {
  id: string;
  name: string;
  questions: { count: number }[];
};

async function fetchThemes(): Promise<ThemeWithCount[]> {
  const { data, error } = await supabase.from("themes").select("id, name, questions(count)");
  if (error) {
    throw new Error(error.message);
  }
  const rows = (data ?? []) as ThemeCountRow[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    questionCount: row.questions[0]?.count ?? 0,
  }));
}

export function useThemes() {
  return useQuery({ queryKey: quizKeys.themes, queryFn: fetchThemes });
}

// Row shape of the `get_random_questions` RPC (setof questions).
type QuestionRow = {
  id: string;
  text: string;
  answer: string;
  aliases: string[];
  misspellings: string[];
  wrong_choices: string[];
};

async function fetchSessionQuestions(themeId: string): Promise<Question[]> {
  const { data, error } = await supabase.rpc("get_random_questions", {
    theme_slug: themeId,
  });
  if (error) {
    throw new Error(error.message);
  }
  const rows = (data ?? []) as QuestionRow[];
  return rows.map((row) => ({
    id: row.id,
    text: row.text,
    answer: row.answer,
    aliases: row.aliases,
    misspellings: row.misspellings,
    wrongChoices: row.wrong_choices,
  }));
}

export function useSessionQuestions(themeId: string) {
  return useQuery({
    queryKey: quizKeys.sessionQuestions(themeId),
    queryFn: () => fetchSessionQuestions(themeId),
    // One random draw per session screen mount: never refetched while the session
    // runs (the 10 questions must stay stable) and never re-served from cache on a
    // later visit (a new session must re-roll).
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  });
}
