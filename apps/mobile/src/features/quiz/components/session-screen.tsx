import { squareChoices } from "@mentis/answer-matching";
import { randomUUID } from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useRef } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { useAuthStore } from "@/features/account/auth-store";
import { useSessionQuestions } from "@/features/quiz/api";
import { DevSkipToResults } from "@/features/quiz/components/dev-skip-to-results";
import { PlayFrame } from "@/features/quiz/components/play-frame";
import { PlayShell } from "@/features/quiz/components/play-shell";
import { SessionResults } from "@/features/quiz/components/session-results";
import { ThemeReveal } from "@/features/quiz/components/theme-reveal";
import {
  QUIT_CANCEL_LABEL,
  QUIT_CONFIRM_LABEL,
  QUIT_LABEL,
  QUIT_MESSAGE,
  QUIT_TITLE,
  SESSION_ERROR,
} from "@/features/quiz/constants";
import { useOutboxStore } from "@/features/quiz/outbox-store";
import { drainOutbox } from "@/features/quiz/outbox-sync";
import { currentQuestion, sessionScore } from "@/features/quiz/session-reducer";
import { useStatsStore } from "@/features/quiz/stats-store";
import { useQuizStore } from "@/features/quiz/store";
import { usePlayLoop } from "@/features/quiz/use-play-loop";
import { useThemeReveal } from "@/features/quiz/use-theme-reveal";

export const SessionScreen = () => {
  const { themeId, name, imageUrl, categoryId, categoryName, categoryColor, categoryIcon } =
    useLocalSearchParams<{
      themeId: string;
      name: string;
      imageUrl: string;
      categoryId: string;
      categoryName: string;
      categoryColor: string;
      categoryIcon: string;
    }>();
  const router = useRouter();
  const { data: questions, isError, isFetching, refetch } = useSessionQuestions(themeId);

  const session = useQuizStore((state) => state.session);
  const startSession = useQuizStore((state) => state.startSession);
  const setInput = useQuizStore((state) => state.setInput);
  const switchToSquare = useQuizStore((state) => state.switchToSquare);
  const select = useQuizStore((state) => state.select);
  const confirm = useQuizStore((state) => state.confirm);
  const expire = useQuizStore((state) => state.expire);
  const clearSession = useQuizStore((state) => state.clearSession);
  const recordSession = useStatsStore((state) => state.recordSession);
  const enqueue = useOutboxStore((state) => state.enqueue);
  const owner = useAuthStore((state) => state.session?.user.id);

  const recordedRef = useRef(false);
  // The pick fixes the Theme, so practice reveals from the very frame the screen mounts.
  const { isDone: isRevealDone, secondsLeft } = useThemeReveal(true);

  // Stable per question (same array element), changes identity on each advance.
  const activeQuestion = session?.status === "active" ? currentQuestion(session) : null;
  const loop = usePlayLoop({
    play: session,
    question: activeQuestion,
    expire,
    // The RNG is injected here at the call site, so the reducer stays pure.
    switchToSquare: () => {
      if (activeQuestion) {
        switchToSquare(squareChoices(activeQuestion, Math.random));
      }
    },
  });

  // The Questions can land mid-Reveal and no Countdown may run behind it, yet the Session must
  // exist in the very frame the Reveal ends — hence layout, so no stand-in screen paints between.
  useLayoutEffect(() => {
    if (isRevealDone && questions && questions.length > 0) {
      startSession(questions, Date.now());
    }
  }, [isRevealDone, questions, startSession]);

  // An abandoned screen (back gesture, web back) must not leak a stale session.
  useEffect(() => clearSession, [clearSession]);

  // The ref guards re-renders, so a finished session is recorded into its world exactly once.
  useEffect(() => {
    if (session?.status === "finished" && !recordedRef.current) {
      recordedRef.current = true;
      const points = sessionScore(session.answers);
      if (owner === undefined) {
        recordSession(themeId, name, points);
      } else {
        enqueue({
          id: randomUUID(),
          owner,
          themeId,
          themeName: name,
          points,
          finishedAt: new Date().toISOString(),
        });
        void drainOutbox(owner);
      }
    }
  }, [session, themeId, name, owner, recordSession, enqueue]);

  // The Theme is fixed by the pick, so the Reveal plays once here — a replay never repeats it.
  if (!isRevealDone) {
    return (
      <ThemeReveal
        name={name}
        imageUrl={imageUrl}
        category={{
          id: categoryId,
          name: categoryName,
          color: categoryColor,
          icon: categoryIcon,
        }}
        secondsLeft={secondsLeft}
      />
    );
  }

  const goHome = () => router.dismissTo("/");

  // Nothing unmounts on a replay, so the record guard and the Questions are both reset by hand.
  const onReplay = () => {
    recordedRef.current = false;
    clearSession();
    void refetch();
  };

  const onConfirmQuit = () => {
    // The unmount cleanup (clearSession) wipes the store, so no trace of the session survives.
    loop.closeQuit();
    goHome();
  };

  // Held at the same slot under the same root in every branch: unmounting it mid-present strands it.
  const quitConfirm = (
    <ConfirmDialog
      visible={loop.quitVisible}
      title={QUIT_TITLE}
      message={QUIT_MESSAGE}
      confirmLabel={QUIT_CONFIRM_LABEL}
      cancelLabel={QUIT_CANCEL_LABEL}
      onCancel={loop.closeQuit}
      onConfirm={onConfirmQuit}
    />
  );

  if (session?.status === "finished") {
    return (
      <>
        <SessionResults
          themeName={name}
          questions={session.questions}
          answers={session.answers}
          onReplay={onReplay}
          onGoHome={goHome}
        />
        {quitConfirm}
      </>
    );
  }

  if (!session) {
    // Landing empty starts no Session, so a Theme drawing nothing fails it exactly as the network does.
    const isDrawLost = (isError || questions?.length === 0) && !isFetching;
    return (
      <>
        <PlayFrame quitLabel={QUIT_LABEL} onQuit={goHome}>
          {/* A retry leaves the query in "error" until it lands, so the spinner stands in for it. */}
          {isDrawLost ? (
            <ScreenError message={SESSION_ERROR} onRetry={() => void refetch()} />
          ) : (
            <ScreenLoading />
          )}
        </PlayFrame>
        {quitConfirm}
      </>
    );
  }

  return (
    <>
      <PlayShell
        play={session}
        total={session.questions.length}
        loop={loop}
        categoryColor={categoryColor}
        showCrown={false}
        quitLabel={QUIT_LABEL}
        headerExtra={<DevSkipToResults />}
        onInputChange={setInput}
        onSelect={select}
        onConfirm={confirm}
      />
      {quitConfirm}
    </>
  );
};
