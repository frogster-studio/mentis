import { appQuestionDrawResponseSchema } from "@mentis/contracts/app";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { parisDay } from "@/features/account/streak";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import type { Question } from "@/types/quiz";
import { QUICK_HOME_QUESTION_COUNT } from "./constants";
import { buildDaySet, isDrawDue, type QuickHomeQuestionDaySet } from "./day-set";
import { useQuickHomeQuestionStore } from "./store";

const quickHomeQuestionKeys = {
  daySet: (day: string) => ["quick-home-question", "day-set", day] as const,
};

// Public read without a theme: the API serves at most one Question per Theme.
function fetchQuickHomeQuestions(): Promise<Question[]> {
  return api.requestJson(
    { method: "GET", path: "/app/questions", query: { n: String(QUICK_HOME_QUESTION_COUNT) } },
    appQuestionDrawResponseSchema,
  );
}

async function drawDaySet(now: Date): Promise<QuickHomeQuestionDaySet> {
  const daySet = buildDaySet(await fetchQuickHomeQuestions(), now, Math.random);
  useQuickHomeQuestionStore.getState().land(daySet);
  return daySet;
}

function useNowRereadOnFocusAndForeground(): Date {
  const [now, setNow] = useState(() => new Date());
  const reread = useCallback(() => {
    const current = new Date();
    setNow(current);
    void queryClient.refetchQueries(
      { queryKey: quickHomeQuestionKeys.daySet(parisDay(current)), type: "active" },
      { cancelRefetch: false },
    );
  }, []);
  useFocusEffect(reread);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        reread();
      }
    });
    return () => subscription.remove();
  }, [reread]);
  return now;
}

export function useQuickHomeQuestionDaySet() {
  const now = useNowRereadOnFocusAndForeground();
  const hasHydrated = useQuickHomeQuestionStore((state) => state.hasHydrated);
  const storedDaySet = useQuickHomeQuestionStore((state) => state.daySet);
  const daySet = isDrawDue(storedDaySet, now) ? null : storedDaySet;
  const draw = useQuery({
    queryKey: quickHomeQuestionKeys.daySet(parisDay(now)),
    queryFn: () => drawDaySet(now),
    enabled: hasHydrated && daySet === null,
    // The reread retries a failed draw on today's key alone, never on a past day's.
    refetchOnWindowFocus: false,
  });
  return { daySet, isPending: !hasHydrated || (daySet === null && draw.isPending) };
}
