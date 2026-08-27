import { squareChoices } from "@mentis/answer-matching";
import { randomUUID } from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { StyleSheet, type TextInput, View } from "react-native";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QuietButton } from "@/components/ui/quiet-button";
import { ScreenContainer } from "@/components/ui/screen-container";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { useAuthStore } from "@/features/account/auth-store";
import { useSessionQuestions } from "@/features/quiz/api";
import { AnswerFooter } from "@/features/quiz/components/answer-footer";
import { DevSkipToResults } from "@/features/quiz/components/dev-skip-to-results";
import { PlayHeader } from "@/features/quiz/components/play-header";
import { PlayScreen } from "@/features/quiz/components/play-screen";
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
import { usePlayClock } from "@/features/quiz/use-play-clock";
import { useThemeReveal } from "@/features/quiz/use-theme-reveal";
import { GUTTER, SPACE } from "@/theme/tokens";

export function SessionScreen() {
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

  const inputRef = useRef<TextInput>(null);
  const recordedRef = useRef(false);
  const [quitVisible, setQuitVisible] = useState(false);
  // The pick fixes the Theme, so practice reveals from the very frame the screen mounts.
  const { isDone: isRevealDone, secondsLeft } = useThemeReveal(true);

  const isActive = session?.status === "active";
  const answeredCount = session?.answers.length ?? 0;
  // Stable per question (same array element), changes identity on each advance.
  const activeQuestion = session && isActive ? currentQuestion(session) : null;
  const now = usePlayClock(session?.endsAt ?? 0, isActive, expire);

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

  // Every question starts with the keyboard open, except under the quit sheet.
  useEffect(() => {
    if (activeQuestion && !quitVisible) {
      inputRef.current?.focus();
    }
  }, [activeQuestion, quitVisible]);

  // The Countdown can Finish the session behind the open sheet — the results take it down.
  useEffect(() => {
    if (session?.status === "finished") {
      setQuitVisible(false);
    }
  }, [session?.status]);

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

  // Nothing unmounts on a replay, so the record guard and the Questions are both reset by hand.
  const onReplay = () => {
    recordedRef.current = false;
    clearSession();
    void refetch();
  };

  const onRequestQuit = () => {
    // The keyboard drops as the sheet rises, so the field lets go before it opens.
    inputRef.current?.blur();
    setQuitVisible(true);
  };

  const onConfirmQuit = () => {
    // The unmount cleanup (clearSession) wipes the store, so no trace of the session survives.
    setQuitVisible(false);
    router.dismissTo("/");
  };

  // Held at the same slot under the same root in every branch: unmounting it mid-present strands it.
  const quitConfirm = (
    <ConfirmDialog
      visible={quitVisible}
      title={QUIT_TITLE}
      message={QUIT_MESSAGE}
      confirmLabel={QUIT_CONFIRM_LABEL}
      cancelLabel={QUIT_CANCEL_LABEL}
      onCancel={() => setQuitVisible(false)}
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
          onGoHome={() => router.dismissTo("/")}
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
        <ScreenContainer>
          {/* Nothing is under way yet, so the quit control leaves straight away — no confirmation. */}
          <View style={styles.header}>
            <QuietButton
              layout="circle"
              icon="close"
              accessibilityLabel={QUIT_LABEL}
              onPress={() => router.dismissTo("/")}
            />
          </View>
          {/* A retry leaves the query in "error" until it lands, so the spinner stands in for it. */}
          {isDrawLost ? (
            <ScreenError message={SESSION_ERROR} onRetry={() => void refetch()} />
          ) : (
            <ScreenLoading />
          )}
        </ScreenContainer>
        {quitConfirm}
      </>
    );
  }

  const onSwitchToSquare = () => {
    if (!activeQuestion) {
      return;
    }
    // The RNG is injected here at the call site, so the reducer stays pure.
    inputRef.current?.blur();
    switchToSquare(squareChoices(activeQuestion, Math.random));
  };

  return (
    <>
      <PlayScreen
        questionText={activeQuestion?.text ?? ""}
        position={answeredCount + 1}
        total={session.questions.length}
        categoryColor={categoryColor}
        header={
          <>
            <PlayHeader
              showCrown={false}
              endsAt={session.endsAt}
              now={now}
              quitLabel={QUIT_LABEL}
              onQuit={onRequestQuit}
            />
            <DevSkipToResults />
          </>
        }
        footer={
          <AnswerFooter
            play={session}
            inputRef={inputRef}
            autoFocus={!quitVisible}
            onInputChange={setInput}
            onSwitchToSquare={onSwitchToSquare}
            onSelect={select}
            onConfirm={() => confirm(Date.now())}
          />
        }
      />
      {quitConfirm}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: GUTTER,
    paddingTop: SPACE.sm,
  },
});
