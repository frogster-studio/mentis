import { Redirect, useRouter } from "expo-router";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { StyleSheet, type TextInput, View } from "react-native";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QuietButton } from "@/components/ui/quiet-button";
import { ALL_SCREEN_EDGES, ScreenContainer } from "@/components/ui/screen-container";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { useAuthStore } from "@/features/account/auth-store";
import { useTodayAttempt, useTranscript } from "@/features/competition/api";
import { currentAttemptQuestion } from "@/features/competition/attempt-reducer";
import { CompetitionResults } from "@/features/competition/components/competition-results";
import {
  COMPETITION_ERROR,
  COMPETITION_EXPIRED_ERROR,
  COMPETITION_JUDGE_ERROR,
  COMPETITION_QUIT_CANCEL_LABEL,
  COMPETITION_QUIT_CONFIRM_LABEL,
  COMPETITION_QUIT_LABEL,
  COMPETITION_QUIT_MESSAGE,
  COMPETITION_QUIT_TITLE,
} from "@/features/competition/constants";
import { queuedFinalize } from "@/features/competition/finalize-outbox";
import { useFinalizeOutboxStore } from "@/features/competition/finalize-outbox-store";
import { drainFinalizeOutbox } from "@/features/competition/finalize-sync";
import { useCompetitionStore } from "@/features/competition/store";
import { AnswerFooter } from "@/features/quiz/components/answer-footer";
import { PlayHeader } from "@/features/quiz/components/play-header";
import { PlayScreen } from "@/features/quiz/components/play-screen";
import { ThemeReveal } from "@/features/quiz/components/theme-reveal";
import { usePlayClock } from "@/features/quiz/use-play-clock";
import { useQuestionTransition } from "@/features/quiz/use-question-transition";
import { useThemeReveal } from "@/features/quiz/use-theme-reveal";
import { isApiError } from "@/lib/api/client";
import { GUTTER, SPACE } from "@/theme/tokens";

export const CompetitionScreen = () => {
  const router = useRouter();
  const owner = useAuthStore((state) => state.session?.user.id);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const { data: attempt, isError, refetch } = useTodayAttempt(owner);

  const play = useCompetitionStore((state) => state.attempt);
  const startAttempt = useCompetitionStore((state) => state.startAttempt);
  const setInput = useCompetitionStore((state) => state.setInput);
  const switchToSquare = useCompetitionStore((state) => state.switchToSquare);
  const select = useCompetitionStore((state) => state.select);
  const confirm = useCompetitionStore((state) => state.confirm);
  const expire = useCompetitionStore((state) => state.expire);
  const clearAttempt = useCompetitionStore((state) => state.clearAttempt);
  const enqueue = useFinalizeOutboxStore((state) => state.enqueue);
  const queued = useFinalizeOutboxStore((state) =>
    attempt === undefined ? undefined : queuedFinalize(state.entries, attempt.id),
  );

  const inputRef = useRef<TextInput>(null);
  const enqueuedRef = useRef(false);
  const [quitVisible, setQuitVisible] = useState(false);

  const isActive = play?.status === "active";
  // An empty batch is only ever safe once the server holds the answers: never before it is queued.
  const isJudgeable = attempt?.status === "finalized" || queued !== undefined;
  const now = usePlayClock(play?.endsAt ?? 0, isActive, expire);
  // Lags question + position through the collapse/expand beat so the swap lands at the peak.
  const transition = useQuestionTransition({
    question: isActive && play ? currentAttemptQuestion(play).text : "",
    position: (play?.answers.length ?? 0) + 1,
  });
  const transcript = useTranscript(owner, attempt?.id, isJudgeable);
  // The queue is acked the moment the batch lands, so the transcript itself holds the screen after.
  const showResults = isJudgeable || transcript.data !== undefined;
  // The server draws the Theme, so the Reveal can only start once its Attempt has landed.
  const isRevealable = attempt?.status === "active" && !showResults;
  const { isDone: isRevealDone, secondsLeft } = useThemeReveal(isRevealable);

  // Layout, so the play exists in the very frame the Reveal ends and no stand-in screen paints.
  useLayoutEffect(() => {
    // A batch still owed owns the Attempt — replaying it would race its own answers.
    const stillQueued = queuedFinalize(
      useFinalizeOutboxStore.getState().entries,
      attempt?.id ?? "",
    );
    if (isRevealDone && attempt?.status === "active" && stillQueued === undefined) {
      startAttempt(attempt, Date.now());
    }
  }, [isRevealDone, attempt, startAttempt]);

  // Leaving the screen abandons the local play only: the Attempt stays active and resumes blank.
  useEffect(() => clearAttempt, [clearAttempt]);

  // The ref guards re-renders, so the finalize batch is queued exactly once.
  useEffect(() => {
    if (play?.status === "finished" && owner !== undefined && !enqueuedRef.current) {
      enqueuedRef.current = true;
      enqueue({ attemptId: play.id, owner, answers: play.answers });
    }
  }, [play, owner, enqueue]);

  // Every question starts with the keyboard open, except under the quit sheet.
  useEffect(() => {
    if (isActive && !quitVisible) {
      inputRef.current?.focus();
    }
  }, [isActive, quitVisible]);

  // The Countdown can finish the Attempt behind the open sheet — the results take it down.
  useEffect(() => {
    if (play?.status === "finished") {
      setQuitVisible(false);
    }
  }, [play?.status]);

  const goHome = () => router.dismissTo("/");

  const onRequestQuit = () => {
    // The keyboard drops as the sheet rises, so the field lets go before it opens.
    inputRef.current?.blur();
    setQuitVisible(true);
  };

  const onConfirmQuit = () => {
    setQuitVisible(false);
    if (play && owner !== undefined) {
      // The positions never reached stay out of the batch: the API zero-fills them.
      enqueuedRef.current = true;
      enqueue({ attemptId: play.id, owner, answers: play.answers });
      void drainFinalizeOutbox(owner);
    }
    goHome();
  };

  // Held at the same slot under the same root in every branch: unmounting it mid-present strands it.
  const quitConfirm = (
    <ConfirmDialog
      visible={quitVisible}
      title={COMPETITION_QUIT_TITLE}
      message={COMPETITION_QUIT_MESSAGE}
      confirmLabel={COMPETITION_QUIT_CONFIRM_LABEL}
      cancelLabel={COMPETITION_QUIT_CANCEL_LABEL}
      onCancel={() => setQuitVisible(false)}
      onConfirm={onConfirmQuit}
    />
  );

  // Nothing is under way yet, so the quit control leaves straight away — no confirmation.
  const framed = (body: ReactNode) => (
    <ScreenContainer edges={ALL_SCREEN_EDGES} underlay={null}>
      <View style={styles.header}>
        <QuietButton
          layout="circle"
          label={null}
          icon="close"
          accessibilityLabel={COMPETITION_QUIT_LABEL}
          onPress={goHome}
          disabled={false}
        />
      </View>
      {body}
    </ScreenContainer>
  );

  if (owner === undefined) {
    return isAuthLoading ? framed(<ScreenLoading />) : <Redirect href="/" />;
  }

  if (showResults) {
    if (transcript.data) {
      return (
        <>
          <CompetitionResults transcript={transcript.data} onGoHome={goHome} />
          {quitConfirm}
        </>
      );
    }
    const expired = isApiError(transcript.error, "ATTEMPT_EXPIRED");
    return (
      <>
        {framed(
          transcript.isError ? (
            <ScreenError
              message={expired ? COMPETITION_EXPIRED_ERROR : COMPETITION_JUDGE_ERROR}
              onRetry={expired ? null : () => void transcript.refetch()}
            />
          ) : (
            <ScreenLoading />
          ),
        )}
        {quitConfirm}
      </>
    );
  }

  if (isError) {
    return (
      <>
        {framed(<ScreenError message={COMPETITION_ERROR} onRetry={() => void refetch()} />)}
        {quitConfirm}
      </>
    );
  }

  // The Attempt is already spent by the time this plays: dying here counts like any quit.
  if (isRevealable && !isRevealDone && attempt) {
    return (
      <ThemeReveal
        name={attempt.themeName}
        imageUrl={attempt.imageUrl}
        category={attempt.category}
        secondsLeft={secondsLeft}
      />
    );
  }

  // A just-finished Attempt holds here for the commit its batch takes to reach the queue.
  if (!play || !attempt || play.status === "finished") {
    return (
      <>
        {framed(<ScreenLoading />)}
        {quitConfirm}
      </>
    );
  }

  return (
    <>
      <PlayScreen
        questionText={transition.question}
        position={transition.position}
        total={play.questions.length}
        categoryColor={attempt.category.color}
        collapsed={transition.collapsed}
        questionOpacity={transition.opacity}
        header={
          <PlayHeader
            showCrown={true}
            endsAt={play.endsAt}
            now={now}
            countdownFrozen={transition.countdownFrozen}
            quitLabel={COMPETITION_QUIT_LABEL}
            onQuit={onRequestQuit}
          />
        }
        footer={
          <AnswerFooter
            play={play}
            categoryColor={attempt.category.color}
            inputRef={inputRef}
            autoFocus={!quitVisible}
            onInputChange={setInput}
            onSwitchToSquare={() => {
              inputRef.current?.blur();
              switchToSquare();
            }}
            onSelect={select}
            onConfirm={() => confirm(Date.now())}
          />
        }
      />
      {quitConfirm}
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: GUTTER,
    paddingTop: SPACE.sm,
  },
});
