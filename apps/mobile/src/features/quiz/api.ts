import { appQuestionDrawResponseSchema, appThemeListResponseSchema } from "@mentis/contracts/app";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Question, ThemeWithCount } from "@/types/quiz";

export const quizKeys = {
  themes: ["quiz", "themes"] as const,
  sessionQuestions: (themeId: string) => ["quiz", "session-questions", themeId] as const,
};

// Public reads: no Authorization header, so the catalog and draw are identical signed in or out.
function fetchThemes(): Promise<ThemeWithCount[]> {
  return api.requestJson({ method: "GET", path: "/app/themes" }, appThemeListResponseSchema);
}

export function useThemes() {
  return useQuery({ queryKey: quizKeys.themes, queryFn: fetchThemes });
}

// Cache-only observer: decorates with the catalog the picker already fetched, never hits the wire.
export function useCachedThemes() {
  return useQuery({ queryKey: quizKeys.themes, queryFn: fetchThemes, enabled: false });
}

// n stays off the wire — the API's default of 10 is the session size.
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
    // Every Quiz Session fetches its own 10 Questions — never re-served, never identity-shared.
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    structuralSharing: false,
  });
}
