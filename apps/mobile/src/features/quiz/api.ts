import { appQuestionDrawResponseSchema, appThemeListResponseSchema } from "@mentis/contracts/app";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Question, ThemeWithCount } from "@/types/quiz";

export const quizKeys = {
  themes: ["quiz", "themes"] as const,
  sessionQuestions: (themeId: string) => ["quiz", "session-questions", themeId] as const,
};

// Both reads are public: the seam sends no Authorization header, so a Player sees the same catalog
// and the same draw signed in or signed out. `questionCount` is computed server-side, and draw
// eligibility (≥10 Questions) stays the client's call — the shelf still decides what it offers.
function fetchThemes(): Promise<ThemeWithCount[]> {
  return api.requestJson({ method: "GET", path: "/app/themes" }, appThemeListResponseSchema);
}

export function useThemes() {
  return useQuery({ queryKey: quizKeys.themes, queryFn: fetchThemes });
}

// `n` is left off the wire: the API defaults it to the 10 a session needs. The cross-theme draw the
// endpoint also offers stays deliberately unused — a session is one Theme.
function fetchSessionQuestions(themeId: string): Promise<Question[]> {
  return api.requestJson(
    { method: "GET", path: "/app/questions", query: { theme: themeId } },
    appQuestionDrawResponseSchema,
  );
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
