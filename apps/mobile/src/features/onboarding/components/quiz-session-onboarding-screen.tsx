import { squareChoices } from "@mentis/answer-matching";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { OnboardingPlayHints } from "@/features/onboarding/components/onboarding-play-hints";
import { ONBOARDING_QUESTION } from "@/features/onboarding/constants";
import { onboardingOutcome } from "@/features/onboarding/outcome";
import { PlayShell } from "@/features/quiz/components/play-shell";
import { QUIT_LABEL } from "@/features/quiz/constants";
import type { SessionAnswer } from "@/features/quiz/session-reducer";
import { useQuizStore } from "@/features/quiz/store";
import { usePlayLoop } from "@/features/quiz/use-play-loop";

export const QuizSessionOnboardingScreen = () => {
  const router = useRouter();
  const session = useQuizStore((state) => state.session);
  const startSession = useQuizStore((state) => state.startSession);
  const setInput = useQuizStore((state) => state.setInput);
  const switchToSquare = useQuizStore((state) => state.switchToSquare);
  const select = useQuizStore((state) => state.select);
  const confirm = useQuizStore((state) => state.confirm);
  const expire = useQuizStore((state) => state.expire);
  const clearSession = useQuizStore((state) => state.clearSession);
  // Held until « Essayer »: the Question is on stage, the Countdown and the keyboard wait.
  const [isHeld, setIsHeld] = useState(true);

  // The one Question stays on stage past its verdict, so the screen holds still while it leaves.
  const loop = usePlayLoop({
    play: session,
    question: session ? ONBOARDING_QUESTION : null,
    isHeld,
    expire,
    switchToSquare: () => switchToSquare(squareChoices(ONBOARDING_QUESTION, Math.random)),
  });

  // Layout, so the Question is on stage in the very first painted frame.
  useLayoutEffect(() => {
    startSession([ONBOARDING_QUESTION], Date.now());
  }, [startSession]);

  useEffect(() => clearSession, [clearSession]);

  // Replaced, not pushed: the end page must never lead back to a test already taken.
  const finish = useCallback(
    (answer: SessionAnswer | null) =>
      router.replace({
        pathname: "/onboarding/end",
        params: { outcome: onboardingOutcome(answer), answer: answer?.input ?? "" },
      }),
    [router],
  );

  useEffect(() => {
    if (session?.status === "finished") {
      finish(session.answers[0]);
    }
  }, [session, finish]);

  const onTry = () => {
    // The Countdown starts here, so the session restarts on a fresh end timestamp.
    startSession([ONBOARDING_QUESTION], Date.now());
    setIsHeld(false);
  };

  if (!session) {
    return null;
  }

  return (
    <PlayShell
      play={session}
      total={session.questions.length}
      loop={loop}
      categoryColor={"#FFF"}
      showCrown={false}
      quitLabel={QUIT_LABEL}
      headerExtra={null}
      footerExtra={isHeld ? <OnboardingPlayHints onTry={onTry} /> : null}
      onQuit={() => finish(null)}
      onInputChange={setInput}
      onSelect={select}
      onConfirm={confirm}
    />
  );
};
